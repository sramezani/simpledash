import "server-only";
import { eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { billing, user, userSettings, type Billing } from "@/lib/db/schema";
import { PAID_STATUSES, planState, trialEnd, type PlanState } from "./plan";
import type { SubscriptionFacts } from "./webhook";

/** Creates the trial and settings rows for a new user (a Better Auth hook). */
export async function createUserRows(userId: string, createdAt: Date) {
  await db
    .insert(billing)
    .values({ userId, trialEndsAt: trialEnd(createdAt) })
    .onConflictDoNothing();
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
}

/** The user's billing row; created from the sign-up date if it's missing. */
export async function getBilling(userId: string): Promise<Billing> {
  const row = await db.query.billing.findFirst({ where: eq(billing.userId, userId) });
  if (row) return row;
  const owner = await db.query.user.findFirst({ where: eq(user.id, userId) });
  await createUserRows(userId, owner?.createdAt ?? new Date());
  return (await db.query.billing.findFirst({ where: eq(billing.userId, userId) }))!;
}

export async function getPlan(userId: string, now: Date = new Date()): Promise<PlanState> {
  return planState(await getBilling(userId), now);
}

/** Saves a subscription state unless a newer one is already stored (the webhook). */
export async function applySubscription(userId: string, facts: SubscriptionFacts, stateAt: Date) {
  const values = {
    status: facts.status,
    plan: facts.plan,
    stripeCustomerId: facts.customerId,
    stripeSubscriptionId: facts.subscriptionId,
    planInterval: facts.interval,
    currentPeriodEnd: facts.currentPeriodEnd,
    cancelAtPeriodEnd: facts.cancelAtPeriodEnd,
    stateAt,
  };
  const rows = await db
    .insert(billing)
    .values({ userId, trialEndsAt: stateAt, ...values })
    .onConflictDoUpdate({
      target: billing.userId,
      set: values,
      // Typed operators, not a raw sql`` template: the driver only converts a Date
      // bound to a column.
      setWhere: or(isNull(billing.stateAt), lte(billing.stateAt, stateAt)),
    })
    .returning({ userId: billing.userId });
  return rows.length > 0;
}

/** False once the account was deleted. */
export async function userExists(userId: string): Promise<boolean> {
  const row = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { id: true } });
  return !!row;
}

export async function findUserByCustomer(customerId: string): Promise<string | null> {
  const row = await db.query.billing.findFirst({ where: eq(billing.stripeCustomerId, customerId) });
  return row?.userId ?? null;
}

/** A subquery of users who aren't locked (paying, or still in the trial), for jobs. */
export function unlockedUserIds(now: Date = new Date()) {
  return db
    .select({ userId: billing.userId })
    .from(billing)
    .where(or(inArray(billing.status, [...PAID_STATUSES]), gt(billing.trialEndsAt, now)));
}

/** True when the user's trial is over and nothing is paid (a quick check for API routes). */
export async function isUserLocked(userId: string): Promise<boolean> {
  return (await getPlan(userId)).kind === "locked";
}
