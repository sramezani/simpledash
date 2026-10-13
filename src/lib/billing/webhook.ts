import type Stripe from "stripe";
import { planIds, type PlanId } from "@/config/plans";
import { PAID_STATUSES } from "./plan";

/**
 * Stripe webhook logic (docs/SPEC.md section 16). Database and Stripe calls are
 * passed in, so it is tested without the network. The newest subscription state
 * always wins: a state older than the one stored is ignored.
 */

export type SubscriptionFacts = {
  subscriptionId: string;
  customerId: string;
  /** Set at checkout in the subscription's metadata. */
  userId: string | null;
  status: string;
  /** From the price: one of our four, or Starter for an unknown one (reported). */
  plan: PlanId;
  interval: "month" | "year" | null;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

/** The four price IDs, two per plan. */
export type PlanPrices = Record<PlanId, Record<"month" | "year", string>>;

/** Which plan and interval a price ID is, or null when it isn't one of ours. */
export function priceInfo(
  priceId: string | null,
  prices: PlanPrices,
): { plan: PlanId; interval: "month" | "year" } | null {
  if (!priceId) return null;
  for (const plan of planIds) {
    for (const interval of ["month", "year"] as const) {
      if (prices[plan][interval] === priceId) return { plan, interval };
    }
  }
  return null;
}

export function subscriptionFacts(
  sub: Stripe.Subscription,
  prices: PlanPrices,
): SubscriptionFacts & { unknownPrice: boolean } {
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const recurring = item?.price?.recurring?.interval;
  const known = priceInfo(priceId, prices);
  const interval: "month" | "year" | null =
    known?.interval ?? (recurring === "month" ? "month" : recurring === "year" ? "year" : null);
  return {
    subscriptionId: sub.id,
    customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    userId: sub.metadata?.userId ?? null,
    status: sub.status,
    // An unknown price never unlocks Growth: it counts as Starter and is reported.
    plan: known?.plan ?? "starter",
    interval,
    priceId,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    unknownPrice: known === null,
  };
}

export type WebhookDeps = {
  /** Stores the event ID. False when it was already stored (a repeat). */
  rememberEvent(eventId: string, type: string): Promise<boolean>;
  /** Removes the stored event ID, so Stripe's retry is handled after a failure. */
  forgetEvent(eventId: string): Promise<void>;
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  findUserByCustomer(customerId: string): Promise<string | null>;
  /** False once the account was deleted (its subscription's events still arrive). */
  userExists(userId: string): Promise<boolean>;
  /** Cancels a running subscription whose account no longer exists, and reports it. */
  cancelOrphan(subscriptionId: string, userId: string): Promise<void>;
  /** Saves the state unless a newer one is stored. True when saved. */
  applySubscription(userId: string, facts: SubscriptionFacts, stateAt: Date): Promise<boolean>;
  reportUnknownPrice(priceId: string | null, subscriptionId: string): void;
  now(): Date;
};

export type WebhookResult = "duplicate" | "ignored" | "applied" | "stale" | "no-user";

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

const idOf = (value: string | { id: string } | null | undefined) =>
  value ? (typeof value === "string" ? value : value.id) : null;

export async function handleStripeEvent(
  event: Stripe.Event,
  deps: WebhookDeps,
  prices: PlanPrices,
): Promise<WebhookResult> {
  if (!HANDLED.has(event.type)) return "ignored";
  if (!(await deps.rememberEvent(event.id, event.type))) return "duplicate";
  try {
    return await process(event, deps, prices);
  } catch (error) {
    await deps.forgetEvent(event.id);
    throw error;
  }
}

async function process(
  event: Stripe.Event,
  deps: WebhookDeps,
  prices: PlanPrices,
): Promise<WebhookResult> {
  let sub: Stripe.Subscription;
  let stateAt: Date;
  let userHint: string | null = null;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subId = idOf(session.subscription);
      if (session.mode !== "subscription" || !subId) return "ignored";
      userHint = session.client_reference_id ?? session.metadata?.userId ?? null;
      sub = await deps.retrieveSubscription(subId);
      stateAt = deps.now(); // fetched just now, so it is the newest state
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      sub = event.data.object;
      stateAt = new Date(event.created * 1000);
      break;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const subId = idOf(event.data.object.parent?.subscription_details?.subscription);
      if (!subId) return "ignored";
      sub = await deps.retrieveSubscription(subId);
      stateAt = deps.now();
      break;
    }
    default:
      return "ignored";
  }

  const facts = subscriptionFacts(sub, prices);
  const userId = userHint ?? facts.userId ?? (await deps.findUserByCustomer(facts.customerId));
  // Not one of ours (another product on the same Stripe account): nothing to do.
  if (!userId) return "no-user";
  if (!(await deps.userExists(userId))) {
    // Paid after the account was deleted (a checkout left open in another tab, say):
    // nobody can use it, so stop the charges.
    if ((PAID_STATUSES as readonly string[]).includes(facts.status)) {
      await deps.cancelOrphan(facts.subscriptionId, userId);
    }
    return "no-user";
  }
  if (facts.unknownPrice) deps.reportUnknownPrice(facts.priceId, facts.subscriptionId);
  return (await deps.applySubscription(userId, facts, stateAt)) ? "applied" : "stale";
}
