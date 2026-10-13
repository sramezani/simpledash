import { plans, type PlanId, type PlanLimits } from "@/config/plans";

/**
 * Plan state (docs/SPEC.md sections 16 and 28). Pure, so it is tested.
 * - Paid: the Stripe subscription is active, trialing or past due.
 * - Trial: otherwise, before trial_ends_at. A trial has Starter's features.
 * - Locked: everything else. Data is kept; the dashboard, email and public page stop.
 */

export const PAID_STATUSES = ["active", "trialing", "past_due"] as const;
export const TRIAL_DAYS = 14;

export type BillingFacts = {
  trialEndsAt: Date;
  status: string | null;
  /** Set by the webhook from the subscription's price; null before the first payment. */
  plan?: PlanId | null;
  planInterval: "month" | "year" | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type PlanState =
  | {
      kind: "paid";
      plan: PlanId;
      interval: "month" | "year" | null;
      renewsAt: Date | null;
      cancelAtPeriodEnd: boolean;
      pastDue: boolean;
    }
  | { kind: "trial"; endsAt: Date; daysLeft: number }
  | { kind: "locked"; trialEndedAt: Date };

const DAY = 24 * 60 * 60 * 1000;

export function planState(b: BillingFacts, now: Date = new Date()): PlanState {
  if (b.status && (PAID_STATUSES as readonly string[]).includes(b.status)) {
    return {
      kind: "paid",
      // Rows paid before Growth existed have no plan yet: they are Starter.
      plan: b.plan ?? "starter",
      interval: b.planInterval,
      renewsAt: b.currentPeriodEnd,
      cancelAtPeriodEnd: b.cancelAtPeriodEnd,
      pastDue: b.status === "past_due",
    };
  }
  if (now < b.trialEndsAt) {
    return {
      kind: "trial",
      endsAt: b.trialEndsAt,
      daysLeft: Math.ceil((b.trialEndsAt.getTime() - now.getTime()) / DAY),
    };
  }
  return { kind: "locked", trialEndedAt: b.trialEndsAt };
}

export const isLocked = (state: PlanState) => state.kind === "locked";

/** The plan whose features apply: Growth only once it is paid for (the trial is Starter). */
export function effectivePlan(state: PlanState): PlanId {
  return state.kind === "paid" ? state.plan : "starter";
}

export type Entitlements = PlanLimits & { plan: PlanId };

/**
 * What the account may use (docs/SPEC.md section 28.1). Every limit on the server
 * comes from here: number of sites, Search Console, revenue.
 */
export function entitlements(state: PlanState): Entitlements {
  const plan = effectivePlan(state);
  return { plan, ...plans[plan].limits };
}

/** When a new account's trial ends. */
export function trialEnd(createdAt: Date): Date {
  return new Date(createdAt.getTime() + TRIAL_DAYS * DAY);
}

/** Upgrading early keeps the rest of the trial, when 48 hours or more are left. */
export function keepTrialUntil(trialEndsAt: Date, now: Date = new Date()): Date | null {
  return trialEndsAt.getTime() - now.getTime() >= 2 * DAY ? trialEndsAt : null;
}
