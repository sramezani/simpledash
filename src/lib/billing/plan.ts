/**
 * Plan state (docs/SPEC.md section 16). Pure, so it is tested.
 * - Paid: the Stripe subscription is active, trialing or past due.
 * - Trial: otherwise, before trial_ends_at.
 * - Locked: everything else. Data is kept; the dashboard, email and public page stop.
 */

export const PAID_STATUSES = ["active", "trialing", "past_due"] as const;
export const TRIAL_DAYS = 14;

export type BillingFacts = {
  trialEndsAt: Date;
  status: string | null;
  planInterval: "month" | "year" | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type PlanState =
  | {
      kind: "paid";
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

/** When a new account's trial ends. */
export function trialEnd(createdAt: Date): Date {
  return new Date(createdAt.getTime() + TRIAL_DAYS * DAY);
}

/** Upgrading early keeps the rest of the trial, when 48 hours or more are left. */
export function keepTrialUntil(trialEndsAt: Date, now: Date = new Date()): Date | null {
  return trialEndsAt.getTime() - now.getTime() >= 2 * DAY ? trialEndsAt : null;
}
