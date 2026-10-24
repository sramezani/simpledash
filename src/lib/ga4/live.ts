import type { protos } from "@google-analytics/data";
import { locate } from "./geo/locate";
import { DEVICE_LABELS, deviceOf, plainValue, type Device } from "./labels";
import { readRows } from "./reports";

/** Live data (docs/SPEC.md section 11.10): pure parsing, so it is tested. */

type RunRealtimeReportResponse = protos.google.analytics.data.v1beta.IRunRealtimeReportResponse;

export type LivePlace = {
  lat: number;
  lng: number;
  visitors: number;
  /** "Amsterdam, Netherlands", or the country alone when GA4 doesn't know the city. */
  label: string;
  /** ISO code, for the flag. */
  countryCode: string;
};

/** The live count, the last number of the overview: one small request, polled while the page is open. */
export type LiveCount = {
  total: number;
  /** The window GA4's realtime covers: 30 minutes (60 on GA4 360). */
  minutes: number;
};

/** Everything the live view shows, asked for only while it is open. */
export type LiveData = LiveCount & {
  places: LivePlace[];
  pages: { title: string; visitors: number }[];
  devices: { device: Device; label: string; visitors: number }[];
  /** Visitors in each minute, oldest first: the last entry is the current minute. */
  perMinute: number[];
  /** Event counts by GA4 event name, for the actions list. */
  events: Record<string, number>;
};

export type LiveResponses = {
  total: RunRealtimeReportResponse;
  places: RunRealtimeReportResponse;
  pages: RunRealtimeReportResponse;
  devices: RunRealtimeReportResponse;
  minutes: RunRealtimeReportResponse;
  events: RunRealtimeReportResponse;
};

const sumVisitors = (response: RunRealtimeReportResponse) =>
  readRows(response).reduce((a, r) => a + (r.metrics.activeUsers ?? 0), 0);

export function parseLiveCount(total: RunRealtimeReportResponse, minutes: number): LiveCount {
  return { total: sumVisitors(total), minutes };
}

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
    .slice(0, 10);
}

function parsePlaces(response: RunRealtimeReportResponse): LivePlace[] {
  // Several GA4 rows can land on one point (unknown cities fall back to the country's centre).
  const byPoint = new Map<string, LivePlace>();
  for (const row of readRows(response)) {
    const visitors = row.metrics.activeUsers ?? 0;
    if (visitors <= 0) continue;
    const country = plainValue(row.dims.country);
    const city = row.dims.city && row.dims.city !== "(not set)" ? row.dims.city : null;
    const countryCode = (row.dims.countryId ?? "").toUpperCase();
    const spot = locate(countryCode, city);
    if (!spot) continue;
    const label = spot.precision === "city" && city ? `${city}, ${country}` : country;
    const key = `${spot.lat},${spot.lng}`;
    const existing = byPoint.get(key);
    if (existing) existing.visitors += visitors;
    else byPoint.set(key, { lat: spot.lat, lng: spot.lng, visitors, label, countryCode });
  }
  return [...byPoint.values()].sort((a, b) => b.visitors - a.visitors);
}

function parseDevices(response: RunRealtimeReportResponse): LiveData["devices"] {
  const byDevice = new Map<Device, number>();
  for (const row of readRows(response)) {
    const device = deviceOf(row.dims.deviceCategory ?? "");
    byDevice.set(device, (byDevice.get(device) ?? 0) + (row.metrics.activeUsers ?? 0));
  }
  return [...byDevice]
    .filter(([, visitors]) => visitors > 0)
    .map(([device, visitors]) => ({ device, label: DEVICE_LABELS[device], visitors }))
    .sort((a, b) => b.visitors - a.visitors);
}

/** GA4 says how many minutes ago ("00" is now); minutes nobody visited have no row. */
function parsePerMinute(response: RunRealtimeReportResponse, minutes: number): number[] {
  const counts = Array.from({ length: minutes }, () => 0);
  for (const row of readRows(response)) {
    const ago = Number(row.dims.minutesAgo);
    if (Number.isInteger(ago) && ago >= 0 && ago < minutes) {
      const i = minutes - 1 - ago;
      counts[i] = (counts[i] ?? 0) + (row.metrics.activeUsers ?? 0);
    }
  }
  return counts;
}

function parseEvents(response: RunRealtimeReportResponse): Record<string, number> {
  const events: Record<string, number> = {};
  for (const row of readRows(response)) {
    const name = row.dims.eventName;
    if (name) events[name] = (events[name] ?? 0) + (row.metrics.eventCount ?? 0);
  }
  return events;
}

export function parseLive(responses: LiveResponses, minutes: number): LiveData {
  return {
    ...parseLiveCount(responses.total, minutes),
    places: parsePlaces(responses.places),
    pages: mergeTitles(readRows(responses.pages)),
    devices: parseDevices(responses.devices),
    perMinute: parsePerMinute(responses.minutes, minutes),
    events: parseEvents(responses.events),
  };
}
