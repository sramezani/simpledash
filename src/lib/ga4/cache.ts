import type { protos } from "@google-analytics/data";
import type { Site } from "@/lib/db/schema";
import { classifyError, quotaBlockedUntil, type Ga4Problem } from "./errors";
import { isBreakerOpen, isQuotaLow } from "./limiter";
import { rangeWindow, type RangeType, type RangeWindow } from "./ranges";
import {
  buildRequest,
  paramsKey,
  parseReport,
  ALL_REPORTS,
  type Payload,
  type ReportName,
  type ReportParams,
} from "./reports";

/**
 * The report cache (docs/SPEC.md section 10.3): show old data at once, refresh in
 * the background. One shared row per property, report, range and inputs.
 * Database, Google and scheduling are passed in, so the logic is tested with fakes.
 */

type RunReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;
type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse;

export type CacheKey = { report: ReportName; paramsHash: string };
export type CacheRow = CacheKey & {
  windowStart: string;
  windowEnd: string;
  payload: unknown;
  fetchedAt: Date;
};

export type CacheDeps = {
  store: {
    read(propertyId: string, rangeType: RangeType, keys: CacheKey[]): Promise<CacheRow[]>;
    upsert(propertyId: string, rangeType: RangeType, rows: CacheRow[]): Promise<void>;
    /** Takes a 30-second refresh lease. Returns the keys it got: no lease means someone else is refreshing. */
    lease(propertyId: string, rangeType: RangeType, keys: CacheKey[]): Promise<CacheKey[]>;
    setError(
      propertyId: string,
      rangeType: RangeType,
      keys: CacheKey[],
      message: string,
    ): Promise<void>;
  };
  sites: {
    markNeedsReconnect(userId: string): Promise<void>;
    markNoAccess(siteId: string): Promise<void>;
    blockQuota(siteId: string, until: Date): Promise<void>;
  };
  fetchBatch(
    userId: string,
    propertyId: string,
    requests: RunReportRequest[],
  ): Promise<RunReportResponse[]>;
  /** Runs work after the response is sent (`after()` in Next.js). */
  schedule(task: () => Promise<void>): void;
  logError(message: string, error: unknown, context: Record<string, string>): void;
};

export type Audience = "owner" | "public";

export type CachedReport<R extends ReportName> = {
  data: Payload<R> | null;
  fetchedAt: Date | null;
  fresh: boolean;
};

export type ReportsResult<R extends ReportName> = {
  window: RangeWindow;
  reports: { [K in R]: CachedReport<K> };
  /** A background refresh started: the page should refresh itself once, a few seconds later. */
  refreshing: boolean;
  /** Why fresh numbers can't be fetched right now, if that's the case. */
  problem: Ga4Problem | null;
  /** When a quota block ends, for the "Numbers refresh after 14:00" note. */
  quotaUntil: Date | null;
};

const HOUR = 60 * 60 * 1000;

/** A site's report inputs: the signup event, and what counts as a sale. */
export const paramsFor = (site: Site): ReportParams => ({
  signupEvent: site.signupEvent,
  saleEvent: site.saleEvent,
  salePage: site.salePage,
});

/**
 * How long a cached report counts as fresh. A period that ends today keeps changing,
 * so it goes stale soonest; one that ended before yesterday won't change any more.
 */
export function maxAge(
  window: Pick<RangeWindow, "type" | "endsToday" | "includesYesterday">,
  audience: Audience,
): number {
  if (window.endsToday) return audience === "public" ? HOUR : HOUR / 2;
  const settled = window.type === "12m" || !window.includesYesterday;
  const base = settled ? 24 * HOUR : 3 * HOUR;
  return audience === "public" ? Math.max(base, 12 * HOUR) : base;
}

function isFresh(row: CacheRow, window: RangeWindow, audience: Audience, now: Date) {
  return (
    row.windowStart === window.current.start &&
    row.windowEnd === window.current.end &&
    now.getTime() - row.fetchedAt.getTime() < maxAge(window, audience)
  );
}

/** A reason not to call Google for this site at all right now. */
export function blockedProblem(site: Site, now: Date): Ga4Problem | null {
  if (site.status === "needs_reconnect") return "revoked";
  if (site.status === "no_access") return "no_access";
  if (site.quotaBlockedUntil && site.quotaBlockedUntil > now) return "quota";
  if (isBreakerOpen(site.propertyId, now.getTime())) return "unavailable";
  return null;
}

const inReportOrder = (names: ReportName[]) => ALL_REPORTS.filter((r) => names.includes(r));

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Fetches reports from GA4 in batches of up to 5 and stores the ones that arrived.
 * A failed batch doesn't throw away the others: its error is returned next to the rows.
 */
async function fetchAndStore(
  deps: CacheDeps,
  site: Site,
  rangeType: RangeType,
  window: RangeWindow,
  names: ReportName[],
  params: ReportParams,
  now: Date,
): Promise<{ rows: CacheRow[]; error: unknown }> {
  const batches = chunk(inReportOrder(names), 5);
  const settled = await Promise.allSettled(
    batches.map(async (batch) => {
      const responses = await deps.fetchBatch(
        site.userId,
        site.propertyId,
        batch.map((report) => buildRequest(report, window, params)),
      );
      return batch.map((report, i) => ({
        report,
        paramsHash: paramsKey(report, params),
        windowStart: window.current.start,
        windowEnd: window.current.end,
        payload: parseReport(report, responses[i] ?? {}, window),
        fetchedAt: now,
      }));
    }),
  );
  const rows = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const failed = settled.find((r) => r.status === "rejected");
  await deps.store.upsert(site.propertyId, rangeType, rows);
  return { rows, error: failed ? failed.reason : null };
}

/** Records what Google's error means for the site, and returns the problem to show. */
async function handleError(deps: CacheDeps, site: Site, error: unknown, now: Date) {
  const classified = classifyError(error);
  const context = { propertyId: site.propertyId, problem: classified.problem };
  let quotaUntil: Date | null = null;
  switch (classified.problem) {
    case "revoked":
      await deps.sites.markNeedsReconnect(site.userId);
      break;
    case "no_access":
      await deps.sites.markNoAccess(site.id);
      break;
    case "quota":
      quotaUntil = quotaBlockedUntil(classified.quota ?? "hourly", now);
      await deps.sites.blockQuota(site.id, quotaUntil);
      break;
    case "bad_request":
    case "unavailable":
      deps.logError("GA4 request failed", error, context);
      break;
  }
  return { problem: classified.problem, quotaUntil, message: classified.message };
}

export async function getReports<R extends ReportName>(
  site: Site,
  rangeType: RangeType,
  names: readonly R[],
  deps: CacheDeps,
  options: { audience?: Audience; now?: Date; cacheOnly?: boolean } = {},
): Promise<ReportsResult<R>> {
  const audience = options.audience ?? "owner";
  const now = options.now ?? new Date();
  const window = rangeWindow(rangeType, site.timeZone, now);
  const params = paramsFor(site);
  const keys: CacheKey[] = names.map((report) => ({
    report,
    paramsHash: paramsKey(report, params),
  }));

  const rows = new Map<ReportName, CacheRow>();
  for (const row of await deps.store.read(site.propertyId, rangeType, keys)) {
    if (keys.some((k) => k.report === row.report && k.paramsHash === row.paramsHash))
      rows.set(row.report, row);
  }

  // Cache only: no Google calls (a public page over its hourly custom-range limit).
  let problem = options.cacheOnly ? null : blockedProblem(site, now);
  let quotaUntil = problem === "quota" ? site.quotaBlockedUntil : null;

  // Missing: fetch now. Rare, because sign-in and the hourly job warm the cache.
  const missing = names.filter((r) => !rows.has(r));
  if (missing.length > 0 && !problem && !options.cacheOnly) {
    let error: unknown = null;
    try {
      const fetched = await fetchAndStore(deps, site, rangeType, window, missing, params, now);
      for (const row of fetched.rows) rows.set(row.report, row);
      error = fetched.error;
    } catch (storeError) {
      error = storeError;
    }
    if (error) ({ problem, quotaUntil } = await handleError(deps, site, error, now));
  }

  // Stale: show it now, refresh after the response is sent.
  const stale = names.filter((r) => {
    const row = rows.get(r);
    return row && !isFresh(row, window, audience, now);
  });
  let refreshing = false;
  if (
    stale.length > 0 &&
    !problem &&
    !options.cacheOnly &&
    !isQuotaLow(site.propertyId, now.getTime())
  ) {
    refreshing = true;
    const staleKeys = keys.filter((k) => stale.includes(k.report as R));
    deps.schedule(() => refreshInBackground(deps, site, rangeType, staleKeys, now));
  }

  const reports = Object.fromEntries(
    names.map((report) => {
      const row = rows.get(report);
      return [
        report,
        {
          data: (row?.payload ?? null) as Payload<R> | null,
          fetchedAt: row?.fetchedAt ?? null,
          fresh: row ? isFresh(row, window, audience, now) : false,
        },
      ];
    }),
  ) as ReportsResult<R>["reports"];

  return { window, reports, refreshing, problem, quotaUntil };
}

/** Refreshes stale reports under a lease, so only one refresh runs at a time. */
export async function refreshInBackground(
  deps: CacheDeps,
  site: Site,
  rangeType: RangeType,
  keys: CacheKey[],
  now: Date = new Date(),
): Promise<void> {
  try {
    const leased = await deps.store.lease(site.propertyId, rangeType, keys);
    if (leased.length === 0) return;
    const window = rangeWindow(rangeType, site.timeZone, now);
    const params = paramsFor(site);
    const { rows, error } = await fetchAndStore(
      deps,
      site,
      rangeType,
      window,
      leased.map((k) => k.report),
      params,
      now,
    );
    if (error) {
      const { message } = await handleError(deps, site, error, now);
      const done = new Set(rows.map((r) => r.report));
      const failed = leased.filter((k) => !done.has(k.report));
      await deps.store.setError(site.propertyId, rangeType, failed, message.slice(0, 500));
    }
  } catch (error) {
    deps.logError("Background refresh failed", error, { propertyId: site.propertyId });
  }
}

/** Fetches the given reports now, whatever their age (the hourly warm-cache job). */
export async function warmReports(
  deps: CacheDeps,
  site: Site,
  rangeType: RangeType,
  names: readonly ReportName[],
  now: Date = new Date(),
): Promise<"warmed" | "fresh" | Ga4Problem> {
  const blocked = blockedProblem(site, now);
  if (blocked) return blocked;
  const window = rangeWindow(rangeType, site.timeZone, now);
  const params = paramsFor(site);
  const keys = names.map((report) => ({ report, paramsHash: paramsKey(report, params) }));
  const rows = await deps.store.read(site.propertyId, rangeType, keys);
  const fresh = new Set(rows.filter((r) => isFresh(r, window, "owner", now)).map((r) => r.report));
  const todo = names.filter((r) => !fresh.has(r));
  if (todo.length === 0) return "fresh";
  const { error } = await fetchAndStore(deps, site, rangeType, window, todo, params, now);
  return error ? (await handleError(deps, site, error, now)).problem : "warmed";
}
