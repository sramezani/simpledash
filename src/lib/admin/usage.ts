import "server-only";
import { and, count, eq, gt, gte, inArray, isNull, lte, not, or, sql, type SQL } from "drizzle-orm";
import { PAID_STATUSES } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { billing, publicPage, site, user, userSettings } from "@/lib/db/schema";

const DAY = 24 * 60 * 60 * 1000;

export type Usage = {
  signups: { total: number; last7: number; last30: number };
  sites: { connected: number; needsReconnect: number };
  /** `otherPaid`: paying with a price that isn't one of the two Starter prices. */
  plans: { trial: number; monthly: number; yearly: number; otherPaid: number; locked: number };
  /** Paying ÷ (paying + locked): of everyone whose trial is over, the share who pay. Null with no data. */
  trialToPaid: number | null;
  publicPages: number;
  weeklyEmail: number;
};

/**
 * `count(*) filter (where …)`, as a number. Conditions use Drizzle's operators: a Date
 * inside a raw sql`` template isn't converted by the driver.
 */
const countWhere = (condition: SQL | undefined) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

/** Usage counts for /admin (docs/SPEC.md section 20). Counts only, nothing per person. */
export async function getUsage(now: Date = new Date()): Promise<Usage> {
  const paid = inArray(billing.status, [...PAID_STATUSES]);
  const unpaid = or(isNull(billing.status), not(paid));
  const [[users], [sites], [plans], [pages], [emails]] = await Promise.all([
    db
      .select({
        total: count(),
        last7: countWhere(gte(user.createdAt, new Date(now.getTime() - 7 * DAY))),
        last30: countWhere(gte(user.createdAt, new Date(now.getTime() - 30 * DAY))),
      })
      .from(user),
    db
      .select({
        connected: countWhere(eq(site.status, "ok")),
        needsReconnect: countWhere(eq(site.status, "needs_reconnect")),
      })
      .from(site)
      .where(eq(site.isActive, true)),
    db
      .select({
        monthly: countWhere(and(paid, eq(billing.planInterval, "month"))),
        yearly: countWhere(and(paid, eq(billing.planInterval, "year"))),
        otherPaid: countWhere(and(paid, isNull(billing.planInterval))),
        trial: countWhere(and(unpaid, gt(billing.trialEndsAt, now))),
        locked: countWhere(and(unpaid, lte(billing.trialEndsAt, now))),
      })
      .from(billing),
    db.select({ value: count() }).from(publicPage).where(eq(publicPage.enabled, true)),
    db.select({ value: count() }).from(userSettings).where(eq(userSettings.weeklyEmail, true)),
  ]);
  const p = plans ?? { monthly: 0, yearly: 0, otherPaid: 0, trial: 0, locked: 0 };
  const paying = p.monthly + p.yearly + p.otherPaid;
  return {
    signups: users ?? { total: 0, last7: 0, last30: 0 },
    sites: sites ?? { connected: 0, needsReconnect: 0 },
    plans: p,
    trialToPaid: paying + p.locked > 0 ? paying / (paying + p.locked) : null,
    publicPages: pages?.value ?? 0,
    weeklyEmail: emails?.value ?? 0,
  };
}
