import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { entitlements, planState } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { billing, revenueSource, site } from "@/lib/db/schema";
import { mapLimit } from "@/lib/ga4/property-choice";
import { needsSync, syncRevenue } from "@/lib/revenue/revenue";

/**
 * Hourly at :20 (docs/SPEC.md sections 20 and 28.3): brings each connected site's
 * Stripe totals up to date. Only accounts whose plan includes revenue (Pro);
 * sites synced in the last hour are skipped.
 */
export async function revenueSyncJob(now: Date = new Date()) {
  const rows = await db
    .select({ source: revenueSource, site, billing })
    .from(revenueSource)
    .innerJoin(site, eq(site.id, revenueSource.siteId))
    .innerJoin(billing, eq(billing.userId, revenueSource.userId))
    .where(and(eq(revenueSource.status, "ok"), isNotNull(site.addedAt)));
  const due = rows.filter(
    (r) => entitlements(planState(r.billing)).revenue && needsSync(r.source, now),
  );
  const results = await mapLimit(due, 3, (r) =>
    syncRevenue(r.site, r.source, now).catch(() => "unavailable" as const),
  );
  const counts: Record<string, number> = {};
  for (const r of results) counts[r] = (counts[r] ?? 0) + 1;
  return { sources: rows.length, due: due.length, ...counts };
}
