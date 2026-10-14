import { plans, type PaidPlanId, type PlanId, type PlanLimits } from "@/config/plans";

/**
 * Plan state (docs/SPEC.md section 16). Pure, so it is tested.
 * - Paid: the Stripe subscription is active, trialing or past due. That's Pro.
 * - Free: everyone else, for as long as they like. Nothing locks; Free has fewer features.
 */

export const PAID_STATUSES = ["active", "trialing", "past_due"] as const;

export type BillingFacts = {
  status: string | null;
  /** Set by the webhook from the subscription's price; null before the first payment. */
  plan?: PaidPlanId | null;
  planInterval: "month" | "year" | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type PlanState =
  | {
      kind: "paid";
      plan: PaidPlanId;
      interval: "month" | "year" | null;
      renewsAt: Date | null;
      cancelAtPeriodEnd: boolean;
      pastDue: boolean;
    }
  | { kind: "free" };

export const isPaidStatus = (status: string | null) =>
  !!status && (PAID_STATUSES as readonly string[]).includes(status);

export function planState(b: BillingFacts): PlanState {
  if (!isPaidStatus(b.status)) return { kind: "free" };
  return {
    kind: "paid",
    plan: b.plan ?? "pro",
    interval: b.planInterval,
    renewsAt: b.currentPeriodEnd,
    cancelAtPeriodEnd: b.cancelAtPeriodEnd,
    pastDue: b.status === "past_due",
  };
}

/** The plan whose features apply. */
export function effectivePlan(state: PlanState): PlanId {
  return state.kind === "paid" ? state.plan : "free";
}

export type Entitlements = PlanLimits & { plan: PlanId };

/**
 * What the account may use. Every limit on the server comes from here: sites, how far
 * back, the Monday email, Search Console, revenue and the public page's link.
 */
export function entitlements(state: PlanState): Entitlements {
  const plan = effectivePlan(state);
  return { plan, ...plans[plan].limits };
}
