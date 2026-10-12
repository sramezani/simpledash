import type { protos } from "@google-analytics/data";
import { locate } from "./geo/locate";
import { plainValue } from "./labels";
import { readRows } from "./reports";

/** Live data (docs/SPEC.md section 11.10): pure parsing, so it is tested. */

type RunRealtimeReportResponse = protos.google.analytics.data.v1beta.IRunRealtimeReportResponse;

export type LivePlace = { lat: number; lng: number; visitors: number; label: string };
export type LiveData = {
  total: number;
  places: LivePlace[];
  pages: { title: string; visitors: number }[];
  /** The window GA4's realtime covers: 30 minutes (60 on GA4 360). */
  minutes: number;
};

/** Live pages by title, busiest first. "(not set)" and empty titles both read "Unknown", so merge them. */
function mergeTitles(rows: ReturnType<typeof readRows>) {
  const byTitle = new Map<string, number>();
  for (const r of rows) {
    const title = plainValue(r.dims.unifiedScreenName);
    byTitle.set(title, (byTitle.get(title) ?? 0) + (r.metrics.activeUsers ?? 0));
  }
  return [...byTitle]
    .map(([title, visitors]) => ({ title, visitors }))
    .filter((p) => p.visitors > 0)
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5);
}

export function parseLive(
  total: RunRealtimeReportResponse,
  places: RunRealtimeReportResponse,
  pages: RunRealtimeReportResponse,
  minutes: number,
): LiveData {
  const totalRows = readRows(total);
  const sum = totalRows.reduce((a, r) => a + (r.metrics.activeUsers ?? 0), 0);

  // Several GA4 rows can land on one point (unknown cities fall back to the country's centre).
  const byPoint = new Map<string, LivePlace>();
  for (const row of readRows(places)) {
    const visitors = row.metrics.activeUsers ?? 0;
    if (visitors <= 0) continue;
    const country = plainValue(row.dims.country);
    const city = row.dims.city && row.dims.city !== "(not set)" ? row.dims.city : null;
    const spot = locate(row.dims.countryId ?? "", city);
    if (!spot) continue;
    const label = spot.precision === "city" && city ? `${city}, ${country}` : country;
    const key = `${spot.lat},${spot.lng}`;
    const existing = byPoint.get(key);
    if (existing) existing.visitors += visitors;
    else byPoint.set(key, { lat: spot.lat, lng: spot.lng, visitors, label });
  }

  return {
    total: sum,
    places: [...byPoint.values()].sort((a, b) => b.visitors - a.visitors),
    pages: mergeTitles(readRows(pages)),
    minutes,
  };
}
