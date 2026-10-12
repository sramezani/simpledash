import "server-only";
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { session, site } from "@/lib/db/schema";
import { unlockedUserIds } from "@/lib/billing/billing";
import { warm } from "@/lib/ga4/data";
import { mapLimit } from "@/lib/ga4/property-choice";
import { REPORTS } from "@/lib/ga4/reports";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Hourly at :05 (docs/SPEC.md section 20). For active, working sites whose owner
 * signed in during the last 14 days, refresh the 7-day reports when they're stale
 * or the day has turned in the site's time zone. Quota-blocked sites are skipped.
 */
export async function warmCacheJob(now: Date = new Date()) {
  const recentUsers = db
    .selectDistinct({ userId: session.userId })
    .from(session)
    .where(gt(session.updatedAt, new Date(now.getTime() - 14 * DAY)));

  const sites = await db
    .select()
    .from(site)
    .where(
      and(
        eq(site.isActive, true),
        eq(site.status, "ok"),
        or(isNull(site.quotaBlockedUntil), lt(site.quotaBlockedUntil, now)),
        inArray(site.userId, recentUsers),
        inArray(site.userId, unlockedUserIds(now)),
      ),
    );

  const results = await mapLimit(sites, 3, (s) =>
    warm(s, "7d", REPORTS).catch(() => "unavailable" as const),
  );
  const counts: Record<string, number> = {};
  for (const r of results) counts[r] = (counts[r] ?? 0) + 1;
  return { sites: sites.length, ...counts };
}
