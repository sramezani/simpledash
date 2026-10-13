import "server-only";
import type { Site } from "@/lib/db/schema";
import { percentChange } from "@/lib/format";
import { loadReports } from "@/lib/ga4/data";
import { comparisonGap } from "@/lib/ga4/ranges";

/** What a site's status means for its numbers, in plain words (or null when fine). */
export function siteProblem(status: Site["status"]): string | null {
  if (status === "needs_reconnect") return "Google access ended";
  if (status === "no_access") return "No access to this site in Google Analytics";
  return null;
}

/**
 * One site's last 7 days for All sites (docs/SPEC.md section 28.1), from the same
 * cached 7-day reports as its dashboard: visitors, the change and the daily line.
 */
export async function siteWeek(site: Site, options: { cacheOnly?: boolean } = {}) {
  const result = await loadReports(site, "7d", ["totals", "series"], options);
  const totals = result.reports.totals.data;
  const gap = comparisonGap(result.window, site.propertyCreatedAt);
  return {
    visitors: totals?.current.visitors ?? null,
    change:
      totals && gap === null
        ? percentChange(totals.current.visitors, totals.previous.visitors)
        : null,
    missing: gap,
    series: result.reports.series.data?.points.map((p) => p.visitors) ?? [],
    problem: siteProblem(site.status),
  };
}
