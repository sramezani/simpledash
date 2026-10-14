import "server-only";
import { and, count, eq, gte, inArray, isNull, not, or, sql, type SQL } from "drizzle-orm";
import { PAID_STATUSES } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { billing, publicPage, site, user, userSettings } from "@/lib/db/schema";

const DAY = 24 * 60 * 60 * 1000;

export type Usage = {
  signups: { total: number; last7: number; last30: number };
  sites: { connected: number; needsReconnect: number };
  /** Accounts per plan. `otherPaid`: paying without a known interval. */
  plans: { free: number; proMonthly: number; proYearly: number; otherPaid: number };
  /** Paying ÷ all accounts: the share on Pro. Null with no accounts. */
  freeToPaid: number | null;
  publicPages: number;
  /** Pro accounts with the Monday email on (Free doesn't get it). */
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
        free: countWhere(unpaid),
        proMonthly: countWhere(and(paid, eq(billing.planInterval, "month"))),
        proYearly: countWhere(and(paid, eq(billing.planInterval, "year"))),
        otherPaid: countWhere(and(paid, isNull(billing.planInterval))),
      })
      .from(billing),
    db.select({ value: count() }).from(publicPage).where(eq(publicPage.enabled, true)),
    db
      .select({ value: count() })
      .from(userSettings)
      .innerJoin(billing, eq(billing.userId, userSettings.userId))
      .where(and(eq(userSettings.weeklyEmail, true), paid)),
  ]);
  const p = plans ?? { free: 0, proMonthly: 0, proYearly: 0, otherPaid: 0 };
  const paying = p.proMonthly + p.proYearly + p.otherPaid;
  return {
    signups: users ?? { total: 0, last7: 0, last30: 0 },
    sites: sites ?? { connected: 0, needsReconnect: 0 },
    plans: p,
    freeToPaid: paying + p.free > 0 ? paying / (paying + p.free) : null,
    publicPages: pages?.value ?? 0,
    weeklyEmail: emails?.value ?? 0,
  };
}
