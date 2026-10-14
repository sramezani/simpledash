import "server-only";
import type { Site } from "@/lib/db/schema";
import { cacheDeps, loadReports } from "@/lib/ga4/data";
import { rangeWindow, type CustomRange, type RangeType } from "@/lib/ga4/ranges";
import type { Payloads, ReportName } from "@/lib/ga4/reports";
import { reportError } from "@/lib/report-error";
import { brandPattern, brandTerms } from "./brand";
import { classifySearchError, querySearchAnalytics, type SearchProblem } from "./client";
import { hostFilter } from "./match";
import {
  latestRequest,
  parseLatest,
  parseSearch,
  searchParamsKey,
  searchRequests,
  SEARCH_REPORTS,
  type SearchContext,
  type SearchPayloads,
  type SearchReportName,
} from "./reports";
import { latestProbe, searchWindow, type SearchWindow } from "./window";

/**
 * Google search insights from cache first (docs/SPEC.md section 28.2): the same
 * `report_cache` table and the same "show old numbers at once, refresh in the
 * background" as GA4's reports. Keyed on the GA4 property, so clean-up stays the same.
 */

const HOUR = 60 * 60 * 1000;
/** Google's newest finished day is looked up again after this long. */
const LATEST_MAX_AGE = 6 * HOUR;
/** Finished Search Console days hardly change, so a fetch stays fresh this long. */
const REPORT_MAX_AGE = 12 * HOUR;
const LATEST_RANGE = "latest";

type Key = { report: SearchReportName; paramsHash: string };
type Row = Key & {
  windowStart: string;
  windowEnd: string;
  payload: unknown;
  fetchedAt: Date;
};
/** The GA4 cache store, used with Search Console's report names. */
type Store = {
  read(propertyId: string, rangeType: string, keys: Key[]): Promise<Row[]>;
  upsert(propertyId: string, rangeType: string, rows: Row[]): Promise<void>;
  lease(propertyId: string, rangeType: string, keys: Key[]): Promise<Key[]>;
};
const store = cacheDeps.store as unknown as Store;

/** A report as cached: its own window, so the card always prints the days it shows. */
type Cached<R extends (typeof SEARCH_REPORTS)[number]> = {
  window: SearchWindow;
  data: SearchPayloads[R];
};

export type SearchCard =
  /** No Search Console property chosen for this site. */
  | { kind: "not_connected" }
  /** Nothing cached, and Search Console couldn't be asked. */
  | { kind: "error"; problem: SearchProblem }
  | {
      kind: "ready";
      /** The days of the numbers shown. Each view keeps its own, which only differ for a
       * moment while a refresh is under way. */
      window: SearchWindow;
      insightsWindow: SearchWindow;
      brandWindow: SearchWindow;
      overview: SearchPayloads["search_overview"];
      insights: SearchPayloads["search_insights"];
      brand: SearchPayloads["search_brand"];
      /** Visits from Google search by landing page (GA4), for the same days. */
      landing: Payloads["search_landing"] | null;
      signups: Payloads["search_signups"] | null;
      /** Why the numbers may be older than they should be, if that's the case. */
      problem: SearchProblem | null;
      /** A background refresh started: the page reloads its data once. */
      refreshing: boolean;
    };

function context(site: Site, window: SearchWindow): SearchContext {
  const terms = brandTerms(site.domain, site.brandTerms);
  return {
    window,
    domain: site.domain,
    pageFilter: hostFilter(site.searchConsoleUrl ?? "", site.domain),
    terms,
    brand: brandPattern(terms),
  };
}

/** Records what an error means and returns the problem to show. */
async function handle(site: Site, error: unknown): Promise<SearchProblem> {
  const problem = classifySearchError(error);
  if (problem === "revoked") await cacheDeps.sites.markNeedsReconnect(site.userId);
  if (problem === "unavailable" || problem === "bad_request") {
    reportError("Search Console request failed", error, { propertyId: site.propertyId, problem });
  }
  return problem;
}

/** Google's newest finished day, from cache (6 hours) or a quick query by date. */
async function latestDay(
  site: Site,
  base: SearchContext,
  now: Date,
): Promise<{ day: string; problem: SearchProblem | null }> {
  const key: Key = {
    report: "search_latest",
    paramsHash: searchParamsKey("search_latest", site.searchConsoleUrl!, base),
  };
  const [row] = await store.read(site.propertyId, LATEST_RANGE, [key]);
  const cached = row ? (row.payload as SearchPayloads["search_latest"]) : null;
  if (cached && now.getTime() - row!.fetchedAt.getTime() < LATEST_MAX_AGE) {
    return { day: cached.day, problem: null };
  }
  try {
    const response = await querySearchAnalytics(
      site.userId,
      site.searchConsoleUrl!,
      latestRequest(base, now),
    );
    const payload = parseLatest(response, now);
    const probe = latestProbe(now);
    await store.upsert(site.propertyId, LATEST_RANGE, [
      { ...key, windowStart: probe.start, windowEnd: probe.end, payload, fetchedAt: now },
    ]);
    return { day: payload.day, problem: null };
  } catch (error) {
    const problem = await handle(site, error);
    if (cached) return { day: cached.day, problem };
    throw Object.assign(new Error("No newest day"), { problem });
  }
}

/** Fetches reports for a window and stores the ones that arrived. */
async function fetchAndStore(
  site: Site,
  rangeType: RangeType,
  ctx: SearchContext,
  names: readonly (typeof SEARCH_REPORTS)[number][],
  now: Date,
): Promise<{ rows: Row[]; error: unknown }> {
  const url = site.searchConsoleUrl!;
  const settled = await Promise.allSettled(
    names.map(async (report): Promise<Row> => {
      const responses = await Promise.all(
        searchRequests(report, ctx).map((r) => querySearchAnalytics(site.userId, url, r)),
      );
      const payload: Cached<typeof report> = {
        window: ctx.window,
        data: parseSearch(report, responses, ctx),
      };
      return {
        report,
        paramsHash: searchParamsKey(report, url, ctx),
        windowStart: ctx.window.current.start,
        windowEnd: ctx.window.current.end,
        payload,
        fetchedAt: now,
      };
    }),
  );
  const rows = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
  await store.upsert(site.propertyId, rangeType, rows);
  const failed = settled.find((s) => s.status === "rejected");
  return { rows, error: failed ? failed.reason : null };
}

const isFresh = (row: Row, window: SearchWindow, now: Date) =>
  row.windowStart === window.current.start &&
  row.windowEnd === window.current.end &&
  now.getTime() - row.fetchedAt.getTime() < REPORT_MAX_AGE;

/**
 * The Google search card's data for a site and the dashboard's range. Search Console
 * is only called for a site with a property chosen; Pro checks happen before.
 */
export async function loadSearch(
  site: Site,
  rangeType: RangeType,
  options: { now?: Date } = {},
): Promise<SearchCard> {
  if (!site.searchConsoleUrl) return { kind: "not_connected" };
  const now = options.now ?? new Date();
  const period = rangeWindow(rangeType, site.timeZone, now).current;
  const base = context(site, searchWindow(period, period.end));

  let latest: { day: string; problem: SearchProblem | null };
  try {
    latest = await latestDay(site, base, now);
  } catch (error) {
    return { kind: "error", problem: (error as { problem?: SearchProblem }).problem ?? "unavailable" };
  }
  const ctx = context(site, searchWindow(period, latest.day));
  const keys: Key[] = SEARCH_REPORTS.map((report) => ({
    report,
    paramsHash: searchParamsKey(report, site.searchConsoleUrl!, ctx),
  }));
  const rows = new Map<string, Row>();
  for (const row of await store.read(site.propertyId, rangeType, keys)) {
    if (keys.some((k) => k.report === row.report && k.paramsHash === row.paramsHash)) {
      rows.set(row.report, row);
    }
  }

  let problem = latest.problem;
  const missing = SEARCH_REPORTS.filter((r) => !rows.has(r));
  if (missing.length > 0 && !problem) {
    const fetched = await fetchAndStore(site, rangeType, ctx, missing, now);
    for (const row of fetched.rows) rows.set(row.report, row);
    if (fetched.error) problem = await handle(site, fetched.error);
  }
  if (SEARCH_REPORTS.some((r) => !rows.has(r))) return { kind: "error", problem: problem ?? "unavailable" };

  const stale = SEARCH_REPORTS.filter((r) => !isFresh(rows.get(r)!, ctx.window, now));
  const refreshing = stale.length > 0 && !problem;
  if (refreshing) {
    const staleKeys = keys.filter((k) => stale.includes(k.report as (typeof SEARCH_REPORTS)[number]));
    cacheDeps.schedule(async () => {
      try {
        const leased = await store.lease(site.propertyId, rangeType, staleKeys);
        if (leased.length === 0) return;
        const names = stale.filter((r) => leased.some((k) => k.report === r));
        const { error } = await fetchAndStore(site, rangeType, ctx, names, now);
        if (error) await handle(site, error);
      } catch (error) {
        reportError("Search Console refresh failed", error, { propertyId: site.propertyId });
      }
    });
  }

  const cached = <R extends (typeof SEARCH_REPORTS)[number]>(r: R) =>
    rows.get(r)!.payload as Cached<R>;
  const overview = cached("search_overview");
  const insights = cached("search_insights");
  const brand = cached("search_brand");
  // Google search visits (GA4) for the same days as the clicks they're joined with.
  const days = insights.window.current;
  const ga4Names: ReportName[] = site.signupEvent
    ? ["search_landing", "search_signups"]
    : ["search_landing"];
  const ga4 = await loadReports(site, `${days.start}..${days.end}` as CustomRange, ga4Names, {
    now,
  }).catch(() => null);

  return {
    kind: "ready",
    window: overview.window,
    insightsWindow: insights.window,
    brandWindow: brand.window,
    overview: overview.data,
    insights: insights.data,
    brand: brand.data,
    landing: ga4?.reports.search_landing?.data ?? null,
    signups: site.signupEvent ? (ga4?.reports.search_signups?.data ?? null) : null,
    problem,
    refreshing: refreshing || !!ga4?.refreshing,
  };
}
