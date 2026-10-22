import "server-only";
import type { Site } from "@/lib/db/schema";
import { dataClient } from "./clients";
import { LIVE_REFRESH } from "./freshness";
import { withPropertySlot } from "./limiter";
import { parseLive, parseLiveCount, type LiveCount, type LiveData } from "./live";

/**
 * Live data (docs/SPEC.md section 11.10). Not stored in Postgres: one result per property
 * is kept in memory for 20 seconds, shared by the dashboard and the public page, so
 * Google is asked at most that often whoever is watching. One server process, so memory
 * is enough.
 *
 * - getLiveCount: the number beside the date menu, one request.
 * - getLive: everything the live view shows (six requests), only while it is open.
 */

export const LIVE_TTL = LIVE_REFRESH;

type Entry<T> = { at: number; data: Promise<T> };
const counts = new Map<string, Entry<LiveCount>>();
const full = new Map<string, Entry<LiveData>>();

function cached<T>(cache: Map<string, Entry<T>>, key: string, now: number, load: () => Promise<T>) {
  const hit = cache.get(key);
  if (hit && now - hit.at < LIVE_TTL) return hit.data;
  const data = load();
  cache.set(key, { at: now, data });
  data.catch(() => cache.delete(key));
  return data;
}

export function getLiveCount(site: Site, now: number = Date.now()): Promise<LiveCount> {
  // A fresh full result already has the count: no need to ask Google again.
  const fresh = full.get(site.propertyId);
  if (fresh && now - fresh.at < LIVE_TTL) {
    return fresh.data.then(({ total, minutes }) => ({ total, minutes }));
  }
  return cached(counts, site.propertyId, now, async () => {
    const { run, property, minutes, metric } = await realtime(site);
    return parseLiveCount(await run({ property, metrics: metric }), minutes);
  });
}

export function getLive(site: Site, now: number = Date.now()): Promise<LiveData> {
  return cached(full, site.propertyId, now, () => fetchLive(site));
}

async function realtime(site: Site) {
  const client = await dataClient(site.userId);
  const minutes = site.serviceLevel === "GOOGLE_ANALYTICS_360" ? 60 : 30;
  const property = site.propertyId;
  const options = { timeout: 10_000, retry: null } as const;
  const run = (request: Parameters<typeof client.runRealtimeReport>[0]) =>
    withPropertySlot(property, async () => (await client.runRealtimeReport(request, options))[0]);
  return { run, property, minutes, metric: [{ name: "activeUsers" }] };
}

async function fetchLive(site: Site): Promise<LiveData> {
  const { run, property, minutes, metric } = await realtime(site);
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
