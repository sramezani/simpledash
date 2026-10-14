import "server-only";
import { and, eq, gt, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { site } from "@/lib/db/schema";
import { warm } from "@/lib/ga4/data";
import { mapLimit } from "@/lib/ga4/property-choice";
import { REPORTS } from "@/lib/ga4/reports";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Hourly at :05 (docs/SPEC.md sections 20 and 28.1). For working sites whose dashboard
 * was opened in the last 24 hours, refresh the 7-day reports when they're stale or the
 * day has turned in the site's time zone, on every plan. Quota-blocked sites are
 * skipped. GA4 calls grow with sites, so sites nobody looks at aren't refreshed: the
 * Monday email and public pages fetch what they need themselves.
 */
export async function warmCacheJob(now: Date = new Date()) {
  const sites = await db
    .select()
    .from(site)
    .where(
      and(
        gt(site.lastViewedAt, new Date(now.getTime() - DAY)),
        isNotNull(site.addedAt),
        eq(site.status, "ok"),
        or(isNull(site.quotaBlockedUntil), lt(site.quotaBlockedUntil, now)),
      ),
    );

  const results = await mapLimit(sites, 3, (s) =>
    warm(s, "7d", REPORTS).catch(() => "unavailable" as const),
  );
  const counts: Record<string, number> = {};
  for (const r of results) counts[r] = (counts[r] ?? 0) + 1;
  return { sites: sites.length, ...counts };
}
