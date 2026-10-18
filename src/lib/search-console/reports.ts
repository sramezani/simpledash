import {
  nearPageOne,
  pageQueries,
  seenNotClicked,
  whatChanged,
  type ChangedPage,
  type NearGroup,
  type NearRow,
  type PageQueries,
  type PageRow,
  type PositionGroup,
  type QueryPageRow,
  type Unclicked,
} from "./insights";
import { latestProbe, newestDay, type SearchWindow } from "./window";

/**
 * The Search Console reports (docs/SPEC.md section 28.2): how each one's requests are
 * built and how the responses become a small payload. Rows are worked into the views
 * at fetch time, so only aggregated top rows are cached. Pure, so it is tested.
 */

export const SEARCH_REPORTS = ["search_overview", "search_insights", "search_brand"] as const;
export type SearchReportName =
  | (typeof SEARCH_REPORTS)[number]
  | "search_latest"
  // A page and search before and since its weekly action was marked done (section 31.3).
  | "search_followup";

type ScFilter = { dimension: "query" | "page"; operator: string; expression: string };
export type ScRequest = {
  startDate: string;
  endDate: string;
  dimensions?: ("date" | "query" | "page")[];
  dimensionFilterGroups?: { groupType: "and"; filters: ScFilter[] }[];
  rowLimit?: number;
  type: "web";
  dataState: "final";
  aggregationType: "auto";
};
export type ScResponse = {
  rows?: { keys?: string[]; clicks?: number; impressions?: number; position?: number }[];
};

export type SearchTotals = { clicks: number; impressions: number; position: number | null };
export type SearchDay = { date: string; clicks: number; impressions: number };

export type SearchPayloads = {
  search_latest: { day: string };
  search_overview: { current: SearchTotals; previous: SearchTotals; days: SearchDay[] };
  search_insights: {
    near: { groups: NearGroup[]; all: NearRow[]; count: number };
    changed: { rising: ChangedPage[]; falling: ChangedPage[] };
    unclicked: { pages: Unclicked[]; groups: Partial<Record<PositionGroup, number>> };
    /** Google clicks per page, for the signups view. */
    pages: { page: string; clicks: number }[];
    /** The searches behind each page, then and now (Brings signups, the weekly pick). */
    pageQueries: PageQueries[];
  };
  search_followup: { before: SearchTotals; after: SearchTotals };
  search_brand: {
    /** The spellings counted as the site's name; empty when there's none to count. */
    terms: string[];
    days: { date: string; brand: number; other: number }[];
    current: { brand: number; other: number };
    previous: { brand: number; other: number };
  };
};

export type SearchContext = {
  window: SearchWindow;
  domain: string | null;
  /** Keeps a subdomain's numbers to its own pages under a parent domain property. */
  pageFilter: string | null;
  /** The name spellings, and their pattern (null when there are none). */
  terms: string[];
  brand: string | null;
};

/** The API returns at most this many rows a request. */
export const MAX_ROWS = 25_000;
/** Bumped when the insights payload changes shape, so old cached ones are fetched again. */
const INSIGHTS_VERSION = 2;

function request(
  range: { start: string; end: string },
  ctx: Pick<SearchContext, "pageFilter">,
  more: Partial<ScRequest> & { query?: { operator: string; expression: string } } = {},
): ScRequest {
  const { query, ...rest } = more;
  const filters = [
    ...(ctx.pageFilter
      ? [{ dimension: "page" as const, operator: "includingRegex", expression: ctx.pageFilter }]
      : []),
    ...(query ? [{ dimension: "query" as const, ...query }] : []),
  ];
  return {
    startDate: range.start,
    endDate: range.end,
    type: "web",
    dataState: "final",
    aggregationType: "auto",
    ...(filters.length ? { dimensionFilterGroups: [{ groupType: "and", filters }] } : {}),
    ...rest,
  };
}

/**
 * One page (and its search, when there is one) before and since a day: clicks and
 * position over the same number of days on each side.
 */
export function followupRequests(
  target: { page: string; query: string | null },
  before: { start: string; end: string },
  after: { start: string; end: string },
): ScRequest[] {
  const filters: ScFilter[] = [
    { dimension: "page", operator: "equals", expression: target.page },
    ...(target.query
      ? [{ dimension: "query" as const, operator: "equals", expression: target.query }]
      : []),
  ];
  const one = (range: { start: string; end: string }): ScRequest => ({
    startDate: range.start,
    endDate: range.end,
    type: "web",
    dataState: "final",
    aggregationType: "auto",
    dimensionFilterGroups: [{ groupType: "and", filters }],
  });
  return [one(before), one(after)];
}

export function parseFollowup(responses: ScResponse[]): SearchPayloads["search_followup"] {
  return { before: totals(responses[0]), after: totals(responses[1]) };
}

/** Finding Google's newest finished day: clicks by date over the last 10 days. */
export function latestRequest(ctx: Pick<SearchContext, "pageFilter">, now: Date): ScRequest {
  return request(latestProbe(now), ctx, { dimensions: ["date"] });
}

export function parseLatest(response: ScResponse, now: Date): SearchPayloads["search_latest"] {
  return {
    day: newestDay(
      (response.rows ?? []).map((r) => r.keys?.[0] ?? ""),
      now,
    ),
  };
}

/** The requests behind one report. */
export function searchRequests(report: (typeof SEARCH_REPORTS)[number], ctx: SearchContext) {
  const { current, previous } = ctx.window;
  switch (report) {
    case "search_overview":
      return [
        request(current, ctx),
        request(previous, ctx),
        request(current, ctx, { dimensions: ["date"] }),
      ];
    case "search_insights":
      return [
        request(current, ctx, { dimensions: ["query", "page"], rowLimit: MAX_ROWS }),
        request(previous, ctx, { dimensions: ["query", "page"], rowLimit: MAX_ROWS }),
        request(current, ctx, { dimensions: ["page"], rowLimit: MAX_ROWS }),
        request(previous, ctx, { dimensions: ["page"], rowLimit: MAX_ROWS }),
      ];
    case "search_brand": {
      if (!ctx.brand) return [];
      const brand = { operator: "includingRegex", expression: ctx.brand };
      const other = { operator: "excludingRegex", expression: ctx.brand };
      return [
        request(current, ctx, { dimensions: ["date"], query: brand }),
        request(current, ctx, { dimensions: ["date"], query: other }),
        request(previous, ctx, { query: brand }),
        request(previous, ctx, { query: other }),
      ];
    }
  }
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function totals(response: ScResponse | undefined): SearchTotals {
  const row = response?.rows?.[0];
  const impressions = num(row?.impressions);
  return {
    clicks: num(row?.clicks),
    impressions,
    position: impressions > 0 ? num(row?.position) : null,
  };
}

function queryPageRows(response: ScResponse | undefined): QueryPageRow[] {
  return (response?.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? "",
    page: r.keys?.[1] ?? "",
    clicks: num(r.clicks),
    impressions: num(r.impressions),
    position: num(r.position),
  }));
}

function pageRows(response: ScResponse | undefined): PageRow[] {
  return (response?.rows ?? []).map((r) => ({
    page: r.keys?.[0] ?? "",
    clicks: num(r.clicks),
    impressions: num(r.impressions),
    position: num(r.position),
  }));
}

const byDate = (response: ScResponse | undefined) =>
  new Map((response?.rows ?? []).map((r) => [r.keys?.[0] ?? "", r]));

/** Every day of the period, with zeros only for days Google reported nothing on. */
function eachDay(range: { start: string; end: string }): string[] {
  const out: string[] = [];
  for (let d = new Date(`${range.start}T00:00:00Z`); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (iso > range.end) return out;
    out.push(iso);
  }
}

type Parsers = {
  [R in (typeof SEARCH_REPORTS)[number]]: (
    responses: ScResponse[],
    ctx: SearchContext,
    days: string[],
  ) => SearchPayloads[R];
};

const parsers: Parsers = {
  search_overview(responses, _ctx, days) {
    const daily = byDate(responses[2]);
    return {
      current: totals(responses[0]),
      previous: totals(responses[1]),
      days: days.map((date) => ({
        date,
        clicks: num(daily.get(date)?.clicks),
        impressions: num(daily.get(date)?.impressions),
      })),
    };
  },

  search_insights(responses, ctx) {
    const qNow = queryPageRows(responses[0]);
    const qThen = queryPageRows(responses[1]);
    const pNow = pageRows(responses[2]);
    const pThen = pageRows(responses[3]);
    return {
      near: nearPageOne(qNow, ctx.domain),
      changed: whatChanged(pNow, pThen, qNow, qThen, ctx.domain),
      unclicked: seenNotClicked(pNow, ctx.domain),
      pages: pNow
        .filter((p) => p.clicks > 0)
        .slice(0, 300)
        .map((p) => ({ page: p.page, clicks: p.clicks })),
      pageQueries: pageQueries(pNow, qNow, qThen, ctx.domain),
    };
  },

  search_brand(responses, ctx, days) {
    if (!ctx.brand) {
      return {
        terms: [],
        days: [],
        current: { brand: 0, other: 0 },
        previous: { brand: 0, other: 0 },
      };
    }
    const brand = byDate(responses[0]);
    const other = byDate(responses[1]);
    const series = days.map((date) => ({
      date,
      brand: num(brand.get(date)?.clicks),
      other: num(other.get(date)?.clicks),
    }));
    return {
      terms: ctx.terms,
      days: series,
      current: {
        brand: series.reduce((a, d) => a + d.brand, 0),
        other: series.reduce((a, d) => a + d.other, 0),
      },
      previous: { brand: totals(responses[2]).clicks, other: totals(responses[3]).clicks },
    };
  },
};

export function parseSearch<R extends (typeof SEARCH_REPORTS)[number]>(
  report: R,
  responses: ScResponse[],
  ctx: SearchContext,
): SearchPayloads[R] {
  const parse = parsers[report] as Parsers[R];
  return parse(responses, ctx, eachDay(ctx.window.current));
}

/** The cache key part for a report's inputs: the property, the page filter, the name. */
export function searchParamsKey(
  report: SearchReportName,
  siteUrl: string,
  ctx: Pick<SearchContext, "pageFilter" | "terms">,
): string {
  const base = `sc=${siteUrl}|f=${ctx.pageFilter ?? ""}`;
  if (report === "search_brand") return `${base}|b=${ctx.terms.join(",")}`;
  // v2 added the searches per page; older cached payloads don't have them.
  if (report === "search_insights") return `${base}|v=${INSIGHTS_VERSION}`;
  return base;
}
