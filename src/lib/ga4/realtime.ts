import "server-only";
import type { Site } from "@/lib/db/schema";
import { dataClient } from "./clients";
import { withPropertySlot } from "./limiter";
import { parseLive, type LiveData } from "./live";

/**
 * Live data for the globe (docs/SPEC.md section 11.10). Not stored in Postgres:
 * one result per property is kept in memory for 60 seconds, shared by the
 * dashboard and the public page. One server process, so memory is enough.
 */

const TTL = 60_000;
const cache = new Map<string, { at: number; data: Promise<LiveData> }>();

export function getLive(site: Site, now: number = Date.now()): Promise<LiveData> {
  const hit = cache.get(site.propertyId);
  if (hit && now - hit.at < TTL) return hit.data;
  const data = fetchLive(site);
  cache.set(site.propertyId, { at: now, data });
  data.catch(() => cache.delete(site.propertyId));
  return data;
}

async function fetchLive(site: Site): Promise<LiveData> {
  const client = await dataClient(site.userId);
  const minutes = site.serviceLevel === "GOOGLE_ANALYTICS_360" ? 60 : 30;
  const property = site.propertyId;
  const options = { timeout: 10_000, retry: null } as const;
  const metric = [{ name: "activeUsers" }];
  const desc = [{ metric: { metricName: "activeUsers" }, desc: true }];
  const run = (request: Parameters<typeof client.runRealtimeReport>[0]) =>
    withPropertySlot(property, async () => (await client.runRealtimeReport(request, options))[0]);

  const [total, places, pages] = await Promise.all([
    run({ property, metrics: metric }),
    run({
      property,
      dimensions: [{ name: "countryId" }, { name: "country" }, { name: "city" }],
      metrics: metric,
      orderBys: desc,
      limit: 100,
    }),
    run({
      property,
      dimensions: [{ name: "unifiedScreenName" }],
      metrics: metric,
      orderBys: desc,
      limit: 5,
    }),
  ]);
  return parseLive(total, places, pages, minutes);
}
