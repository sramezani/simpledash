import "server-only";
import type Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/config/plans";
import { env } from "@/lib/env";
import { reportError } from "@/lib/report-error";
import { getBilling } from "./billing";
import { keepTrialUntil, planState } from "./plan";
import { planPrices, stripe } from "./stripe";

/**
 * Upgrade (docs/SPEC.md sections 16 and 28.1): a Stripe Checkout Session for the
 * chosen plan and interval. The browser only sends the plan and "month" or "year";
 * the price ID is picked here.
 */
export async function createCheckout(
  user: { id: string; email: string },
  plan: PlanId,
  interval: BillingInterval,
): Promise<string> {
  const row = await getBilling(user.id);
  const keepTrial = keepTrialUntil(row.trialEndsAt);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: planPrices()[plan][interval], quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
      ...(keepTrial ? { trial_end: Math.floor(keepTrial.getTime() / 1000) } : {}),
    },
    ...(row.stripeCustomerId ? { customer: row.stripeCustomerId } : { customer_email: user.email }),
    success_url: `${env.APP_URL}/dashboard?upgraded=${plan}`,
    cancel_url: `${env.APP_URL}/settings#billing`,
    ...(env.STRIPE_MANAGED_PAYMENTS ? { managed_payments: { enabled: true } } : {}),
  };
  const session = await stripe.checkout.sessions.create(params);
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

/** Manage billing: the Stripe Customer Portal (card, invoices, cancel, plans). */
export async function createPortal(userId: string): Promise<string | null> {
  const row = await getBilling(userId);
  if (!row.stripeCustomerId) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${env.APP_URL}/settings#billing`,
  });
  return session.url;
}

/**
 * Someone who already pays changes plan: the Portal's "confirm a subscription update"
 * screen, preset to the chosen price, so it is one confirm at Stripe with Stripe's own
 * proration. If the Portal isn't set up for switching plans, the plain Portal opens.
 */
export async function createPlanChange(
  userId: string,
  plan: PlanId,
  interval: BillingInterval,
): Promise<string | null> {
  const row = await getBilling(userId);
  if (!row.stripeCustomerId) return null;
  const price = planPrices()[plan][interval];
  if (row.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
      const item = sub.items.data[0];
      if (item && item.price.id === price) return createPortal(userId);
      if (item && sub.items.data.length === 1) {
        const session = await stripe.billingPortal.sessions.create({
          customer: row.stripeCustomerId,
          return_url: `${env.APP_URL}/settings#billing`,
          flow_data: {
            type: "subscription_update_confirm",
            subscription_update_confirm: {
              subscription: sub.id,
              items: [{ id: item.id, price, quantity: 1 }],
            },
            after_completion: {
              type: "redirect",
              redirect: { return_url: `${env.APP_URL}/dashboard?upgraded=${plan}` },
            },
          },
        });
        return session.url;
      }
    } catch (error) {
      // Most likely the Portal doesn't allow plan switching yet (Siamak's part).
      reportError("Plan change flow failed; opening the plain Portal", error, { userId, plan });
    }
  }
  return createPortal(userId);
}

/** True when the user already pays, so a plan change goes through the Portal. */
export async function isPaying(userId: string): Promise<boolean> {
  return planState(await getBilling(userId)).kind === "paid";
}
