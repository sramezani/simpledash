import "server-only";
import type { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { Site } from "@/lib/db/schema";
import { withDataClient } from "./clients";
import { LIVE_REFRESH } from "./freshness";
import { withPropertySlot } from "./limiter";
import { parseLive, parseLiveCount, type LiveCount, type LiveData } from "./live";

/**
 * Live data (docs/SPEC.md section 11.10). Not stored in Postgres: one result per property
 * is kept in memory for 20 seconds, shared by the dashboard and the public page, so
 * Google is asked at most that often whoever is watching. One server process, so memory
 * is enough.
 *
 * - getLiveCount: the live count in the overview, one request.
 * - getLive: everything the live view shows (six requests), only while it is open.
 */

export const LIVE_TTL = LIVE_REFRESH;

type Entry<T> = { at: number; data: Promise<T> };
const counts = new Map<string, Entry<LiveCount>>();
const full = new Map<string, Entry<LiveData>>();

function cached<T>(
  cache: Map<string, Entry<T>>,
  key: string,
  now: number,
  maxAge: number,
  load: () => Promise<T>,
) {
  const hit = cache.get(key);
  if (hit && now - hit.at < maxAge) return hit.data;
  const data = load();
  cache.set(key, { at: now, data });
  data.catch(() => cache.delete(key));
  return data;
}

/** `maxAge` is shorter only for the dashboard's early ask (LIVE_EARLY). */
export function getLiveCount(
  site: Site,
  now: number = Date.now(),
  maxAge: number = LIVE_TTL,
): Promise<LiveCount> {
  // A fresh full result already has the count: no need to ask Google again.
  const fresh = full.get(site.propertyId);
  if (fresh && now - fresh.at < maxAge) {
    return fresh.data.then(({ total, minutes }) => ({ total, minutes }));
  }
  return cached(counts, site.propertyId, now, maxAge, () =>
    withDataClient(site.userId, async (client) => {
      const { run, property, minutes, metric } = realtime(site, client);
      return parseLiveCount(await run({ property, metrics: metric }), minutes);
    }),
  );
}

export function getLive(site: Site, now: number = Date.now()): Promise<LiveData> {
  return cached(full, site.propertyId, now, LIVE_TTL, () => fetchLive(site));
}

function realtime(site: Site, client: BetaAnalyticsDataClient) {
  const minutes = site.serviceLevel === "GOOGLE_ANALYTICS_360" ? 60 : 30;
  const property = site.propertyId;
  const options = { timeout: 10_000, retry: null } as const;
  const run = (request: Parameters<typeof client.runRealtimeReport>[0]) =>
    withPropertySlot(property, async () => (await client.runRealtimeReport(request, options))[0]);
  return { run, property, minutes, metric: [{ name: "activeUsers" }] };
}

function fetchLive(site: Site): Promise<LiveData> {
  return withDataClient(site.userId, (client) => fetchLiveWith(site, client));
}

async function fetchLiveWith(site: Site, client: BetaAnalyticsDataClient): Promise<LiveData> {
  const { run, property, minutes, metric } = realtime(site, client);
  const desc = [{ metric: { metricName: "activeUsers" }, desc: true }];
  const by = (dimension: string, limit: number) =>
    run({ property, dimensions: [{ name: dimension }], metrics: metric, orderBys: desc, limit });

  const [total, places, pages, devices, perMinute, events] = await Promise.all([
    run({ property, metrics: metric }),
    run({
      property,
      dimensions: [{ name: "countryId" }, { name: "country" }, { name: "city" }],
      metrics: metric,
      orderBys: desc,
      limit: 100,
    }),
    by("unifiedScreenName", 10),
    by("deviceCategory", 5),
    run({ property, dimensions: [{ name: "minutesAgo" }], metrics: metric, limit: minutes }),
    run({
      property,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 50,
    }),
  ]);
  return parseLive({ total, places, pages, devices, minutes: perMinute, events }, minutes);
}
