import type { protos } from "@google-analytics/data";
import { AI_CHANNEL, AI_LIST_VERSION, AI_SOURCES, aiAssistantName } from "./ai-sources";
import {
  browserLabel,
  channelLabel,
  DEVICE_LABELS,
  deviceOf,
  plainValue,
  sourceLabel,
  systemLabel,
  type Device,
} from "./labels";
import { seriesKeys, type Granularity, type RangeWindow } from "./ranges";

/**
 * The reports for one range (docs/SPEC.md section 10.2): how each request is
 * built and how its response becomes a small, aggregated payload. Pure, so it is tested.
 */

type RunReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;
type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse;
type FilterExpression = protos.google.analytics.data.v1beta.IFilterExpression;

export const REPORTS = [
  "totals",
  "series",
  "sources",
  "channels",
  "pages",
  "landing",
  "countries",
  "devices",
  "actions",
  "ai_sources",
  "ai_pages",
  "browsers",
  "systems",
  "cities",
] as const;

/**
 * Reports only some views ask for, never part of the dashboard's load: visits from
 * Google search by landing page, for the Google search card (docs/SPEC.md section 28.2).
 */
export const EXTRA_REPORTS = [
  "search_landing",
  "search_signups",
  // What brings customers, by last visit and landing page (docs/SPEC.md section 28.3).
  "goals_sources",
  "goals_landing",
  "sale_page_sources",
  "sale_page_landing",
  "purchase_sources",
  "purchase_landing",
  // What brings customers: first visit, paths and days to the signup or sale (section 31.1).
  "first_goals",
  "first_sale_page",
  "first_purchase",
  "goal_paths",
  "sale_page_paths",
  "goal_days",
  "sale_page_days",
  // What changed and where: sources and landing pages, then and now (section 31.2).
  "change_paths",
  "change_goals",
  "change_sale_page",
] as const;
export const ALL_REPORTS = [...REPORTS, ...EXTRA_REPORTS] as const;
export type ReportName = (typeof ALL_REPORTS)[number];

/** The most landing pages asked for from Google search; a list this long may be cut off. */
export const SEARCH_LANDING_LIMIT = 250;
/** The most rows asked for in the sales reports. */
export const SALES_LIMIT = 250;
/** The most rows asked for in the days-to-signup reports: one per first day, day and event. */
export const DAYS_LIMIT = 10_000;
/** The most rows asked for in What changed's reports (rows of both periods together). */
export const CHANGE_LIMIT = 500;

/** Events counted by the Actions card. The signup event is added when one is chosen. */
export const ACTION_EVENTS = ["file_download", "click", "form_submit"] as const;

export type ReportParams = {
  signupEvent: string | null;
  /** What counts as a sale (Pro): a key event or a thank-you page path. */
  saleEvent?: string | null;
  salePage?: string | null;
};

// ── Payloads: aggregated rows only, never visitor-level data ──────────────

export type Totals = { visitors: number; pageViews: number; engagementSeconds: number };
/** Days from someone's first visit to their signup or sale, counted in groups. */
export type DayBuckets = {
  sameDay: number;
  week: number;
  month: number;
  later: number;
  /** GA4 had no first-visit day for these. */
  unknown: number;
};
/** Where someone first came from, and where the visit with the signup or sale came from. */
export type PathKey = { first: string; firstLabel: string; last: string; lastLabel: string };
/** A source and landing page, with a count in this period and the one before. */
export type ChangeCell = { source: string; path: string; now: number; then: number };
export type Payloads = {
  totals: { current: Totals; previous: Totals };
  series: { granularity: Granularity; points: { key: string; visitors: number }[] };
  sources: { rows: { source: string; label: string; visitors: number; previous: number }[] };
  channels: { rows: { channel: string; label: string; visitors: number }[] };
  pages: { rows: { path: string; views: number; visitors: number }[] };
  landing: { rows: { path: string; visitors: number }[] };
  countries: { rows: { code: string; name: string; visitors: number }[] };
  devices: { rows: { device: Device; label: string; visitors: number }[] };
  actions: { current: Record<string, number>; previous: Record<string, number> };
  ai_sources: { rows: { assistant: string; visitors: number }[] };
  ai_pages: { rows: { path: string; visitors: number }[] };
  browsers: { rows: { browser: string; label: string; visitors: number }[] };
  systems: { rows: { os: string; label: string; visitors: number }[] };
  cities: { rows: { city: string; code: string; visitors: number }[] };
  search_landing: { rows: { path: string; visitors: number }[]; complete: boolean };
  search_signups: { rows: { path: string; signups: number }[]; complete: boolean };
  /** Counts of the signup and sale events, per source and landing page. */
  goals_sources: { rows: { source: string; label: string; events: Record<string, number> }[] };
  goals_landing: { rows: { path: string; events: Record<string, number> }[] };
  /** Views of the thank-you page, per source and landing page. */
  sale_page_sources: { rows: { source: string; label: string; views: number }[] };
  sale_page_landing: { rows: { path: string; views: number }[] };
  /** GA4's own purchase revenue (in the property's currency, major units). */
  purchase_sources: { rows: { source: string; label: string; revenue: number }[]; total: number };
  purchase_landing: { rows: { path: string; revenue: number }[]; total: number };
  /** The same counts by where each person first came from (GA4's first user source). */
  first_goals: { rows: { source: string; label: string; events: Record<string, number> }[] };
  first_sale_page: { rows: { source: string; label: string; views: number }[] };
  first_purchase: { rows: { source: string; label: string; revenue: number }[]; total: number };
  /** First visit → the visit with the signup or sale. */
  goal_paths: { rows: (PathKey & { events: Record<string, number> })[]; complete: boolean };
  sale_page_paths: { rows: (PathKey & { views: number })[]; complete: boolean };
  /** Days from the first visit, per event. Only the groups are kept. */
  goal_days: { events: Record<string, DayBuckets>; complete: boolean };
  sale_page_days: { days: DayBuckets; complete: boolean };
  /** Visitors per source and landing page, then and now. */
  change_paths: { rows: ChangeCell[]; complete: boolean };
  /** Signup and sale events per source and landing page, then and now. */
  change_goals: {
    rows: {
      source: string;
      path: string;
      now: Record<string, number>;
      then: Record<string, number>;
    }[];
    complete: boolean;
  };
  /** Thank-you page views per source and landing page, then and now. */
  change_sale_page: { rows: ChangeCell[]; complete: boolean };
};
export type Payload<R extends ReportName> = Payloads[R];

// ── Requests ──────────────────────────────────────────────────────────────

const metric = (name: string) => ({ name });
const dimension = (name: string) => ({ name });
const desc = (metricName: string) => ({ metric: { metricName }, desc: true });

function dateRanges(window: RangeWindow, periods: "both" | "current") {
  const current = { startDate: window.current.start, endDate: window.current.end, name: "current" };
  if (periods === "current") return [current];
  return [
    current,
    { startDate: window.previous.start, endDate: window.previous.end, name: "previous" },
  ];
}

/** Visits from Google search: source "google", medium "organic" (GA4's own attribution). */
export const googleSearchFilter: FilterExpression = {
  andGroup: {
    expressions: [
      {
        filter: {
          fieldName: "sessionSource",
          stringFilter: { matchType: "EXACT", value: "google" },
        },
      },
      {
        filter: {
          fieldName: "sessionMedium",
          stringFilter: { matchType: "EXACT", value: "organic" },
        },
      },
    ],
  },
};

/** The AI filter: GA4's AI channel, or a source from our list (docs/SPEC.md section 11.5). */
export const aiFilter: FilterExpression = {
  orGroup: {
    expressions: [
      {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: { matchType: "EXACT", value: AI_CHANNEL },
        },
      },
      {
        filter: {
          fieldName: "sessionSource",
          inListFilter: { values: Object.keys(AI_SOURCES), caseSensitive: false },
        },
      },
    ],
  },
};

export function actionEvents(params: ReportParams): string[] {
  const events: string[] = [...ACTION_EVENTS];
  if (params.signupEvent && !events.includes(params.signupEvent)) events.push(params.signupEvent);
  return events;
}

/** The events the sales reports count: the signup event and the sale event. */
export function goalEvents(params: ReportParams): string[] {
  return [...new Set([params.signupEvent, params.saleEvent].filter((e): e is string => !!e))];
}

/** Reports that count the signup and sale events, and reports of thank-you page views. */
const GOAL_REPORTS = new Set<ReportName>([
  "goals_sources",
  "goals_landing",
  "first_goals",
  "goal_paths",
  "goal_days",
  "change_goals",
]);
const SALE_PAGE_REPORTS = new Set<ReportName>([
  "sale_page_sources",
  "sale_page_landing",
  "first_sale_page",
  "sale_page_paths",
  "sale_page_days",
  "change_sale_page",
]);

const goalFilter = (params: ReportParams): FilterExpression => ({
  filter: { fieldName: "eventName", inListFilter: { values: goalEvents(params) } },
});

const salePageFilter = (params: ReportParams): FilterExpression => ({
  filter: {
    fieldName: "pagePath",
    stringFilter: { matchType: "EXACT", value: params.salePage ?? "" },
  },
});

/** The cache key part for a report's extra inputs (docs/SPEC.md section 9). */
export function paramsKey(report: ReportName, params: ReportParams): string {
  if (report === "actions" || report === "search_signups")
    return `signup=${params.signupEvent ?? ""}`;
  if (GOAL_REPORTS.has(report)) return `goals=${goalEvents(params).join(",")}`;
  if (SALE_PAGE_REPORTS.has(report)) return `page=${params.salePage ?? ""}`;
  if (report === "ai_sources" || report === "ai_pages") return `ai=v${AI_LIST_VERSION}`;
  return "-";
}

/**
 * What the sales reports break their counts down by. "Last visit" is GA4's session
 * source, which already skips direct visits when it knows an earlier source; "first
 * visit" is the first user source, which never changes for a person.
 */
const BREAKDOWN = {
  goals_sources: ["sessionSource"],
  goals_landing: ["landingPage"],
  first_goals: ["firstUserSource"],
  goal_paths: ["firstUserSource", "sessionSource"],
  goal_days: ["firstSessionDate", "date"],
  sale_page_sources: ["sessionSource"],
  sale_page_landing: ["landingPage"],
  first_sale_page: ["firstUserSource"],
  sale_page_paths: ["firstUserSource", "sessionSource"],
  sale_page_days: ["firstSessionDate", "date"],
  purchase_sources: ["sessionSource"],
  purchase_landing: ["landingPage"],
  first_purchase: ["firstUserSource"],
} satisfies Partial<Record<ReportName, string[]>>;

export function buildRequest(
  report: ReportName,
  window: RangeWindow,
  params: ReportParams,
): RunReportRequest {
  switch (report) {
    case "totals":
      return {
        dateRanges: dateRanges(window, "both"),
        metrics: [
          metric("activeUsers"),
          metric("screenPageViews"),
          metric("userEngagementDuration"),
        ],
      };
    case "series":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension(window.granularity)],
        metrics: [metric("activeUsers")],
        orderBys: [{ dimension: { dimensionName: window.granularity } }],
        limit: 1000,
      };
    case "sources":
      return {
        dateRanges: dateRanges(window, "both"),
        dimensions: [dimension("sessionSource")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 100,
      };
    case "channels":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("sessionDefaultChannelGroup")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 25,
      };
    case "pages":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("pagePath")],
        metrics: [metric("screenPageViews"), metric("activeUsers")],
        orderBys: [desc("screenPageViews")],
        limit: 50,
      };
    case "landing":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("landingPage")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 50,
      };
    case "countries":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("countryId"), dimension("country")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 50,
      };
    case "devices":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("deviceCategory")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
      };
    case "actions":
      return {
        dateRanges: dateRanges(window, "both"),
        dimensions: [dimension("eventName")],
        metrics: [metric("eventCount")],
        dimensionFilter: {
          filter: { fieldName: "eventName", inListFilter: { values: actionEvents(params) } },
        },
      };
    case "ai_sources":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("sessionSource")],
        metrics: [metric("activeUsers")],
        dimensionFilter: aiFilter,
        orderBys: [desc("activeUsers")],
        limit: 20,
      };
    case "ai_pages":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("landingPage")],
        metrics: [metric("activeUsers")],
        dimensionFilter: aiFilter,
        orderBys: [desc("activeUsers")],
        limit: 10,
      };
    case "browsers":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("browser")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 50,
      };
    case "systems":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("operatingSystem")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 25,
      };
    case "cities":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("city"), dimension("countryId")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: 100,
      };
    case "search_landing":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("landingPage")],
        metrics: [metric("activeUsers")],
        dimensionFilter: googleSearchFilter,
        orderBys: [desc("activeUsers")],
        limit: SEARCH_LANDING_LIMIT,
      };
    case "search_signups":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [dimension("landingPage")],
        metrics: [metric("eventCount")],
        dimensionFilter: {
          andGroup: {
            expressions: [
              googleSearchFilter,
              {
                filter: {
                  fieldName: "eventName",
                  stringFilter: { matchType: "EXACT", value: params.signupEvent ?? "" },
                },
              },
            ],
          },
        },
        orderBys: [desc("eventCount")],
        limit: SEARCH_LANDING_LIMIT,
      };
    case "goals_sources":
    case "goals_landing":
    case "first_goals":
    case "goal_paths":
    case "goal_days":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: [...BREAKDOWN[report].map(dimension), dimension("eventName")],
        metrics: [metric("eventCount")],
        dimensionFilter: goalFilter(params),
        orderBys: [desc("eventCount")],
        limit: report === "goal_days" ? DAYS_LIMIT : SALES_LIMIT,
      };
    case "sale_page_sources":
    case "sale_page_landing":
    case "first_sale_page":
    case "sale_page_paths":
    case "sale_page_days":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: BREAKDOWN[report].map(dimension),
        metrics: [metric("screenPageViews")],
        dimensionFilter: salePageFilter(params),
        orderBys: [desc("screenPageViews")],
        limit: report === "sale_page_days" ? DAYS_LIMIT : SALES_LIMIT,
      };
    case "change_paths":
      return {
        dateRanges: dateRanges(window, "both"),
        dimensions: [dimension("sessionSource"), dimension("landingPage")],
        metrics: [metric("activeUsers")],
        orderBys: [desc("activeUsers")],
        limit: CHANGE_LIMIT,
      };
    case "change_goals":
      return {
        dateRanges: dateRanges(window, "both"),
        dimensions: [dimension("sessionSource"), dimension("landingPage"), dimension("eventName")],
        metrics: [metric("eventCount")],
        dimensionFilter: goalFilter(params),
        orderBys: [desc("eventCount")],
        limit: CHANGE_LIMIT,
      };
    case "change_sale_page":
      return {
        dateRanges: dateRanges(window, "both"),
        dimensions: [dimension("sessionSource"), dimension("landingPage")],
        metrics: [metric("screenPageViews")],
        dimensionFilter: salePageFilter(params),
        orderBys: [desc("screenPageViews")],
        limit: CHANGE_LIMIT,
      };
    case "purchase_sources":
    case "purchase_landing":
    case "first_purchase":
      return {
        dateRanges: dateRanges(window, "current"),
        dimensions: BREAKDOWN[report].map(dimension),
        metrics: [metric("purchaseRevenue")],
        orderBys: [desc("purchaseRevenue")],
        limit: SALES_LIMIT,
      };
  }
}

// ── Responses ─────────────────────────────────────────────────────────────

type Row = {
  dims: Record<string, string>;
  metrics: Record<string, number>;
  period: "current" | "previous";
};

/** Turns GA4's rows into plain objects keyed by field name. */
export function readRows(response: RunReportResponse): Row[] {
  const dimNames = (response.dimensionHeaders ?? []).map((h) => h.name ?? "");
  const metricNames = (response.metricHeaders ?? []).map((h) => h.name ?? "");
  return (response.rows ?? []).map((row) => {
    const dims: Record<string, string> = {};
    dimNames.forEach((name, i) => (dims[name] = row.dimensionValues?.[i]?.value ?? ""));
    const metrics: Record<string, number> = {};
    metricNames.forEach((name, i) => {
      const n = Number(row.metricValues?.[i]?.value ?? 0);
      metrics[name] = Number.isFinite(n) ? n : 0;
    });
    // With two date ranges, GA4 adds a "dateRange" dimension holding the range's name.
    const period = dims.dateRange === "previous" ? "previous" : "current";
    return { dims, metrics, period };
  });
}

const zeroTotals = (): Totals => ({ visitors: 0, pageViews: 0, engagementSeconds: 0 });

function sumBy<K extends string>(
  rows: Row[],
  key: (row: Row) => K,
  metricName: string,
  period?: Row["period"],
) {
  const out = new Map<K, number>();
  for (const row of rows) {
    if (period && row.period !== period) continue;
    const k = key(row);
    out.set(k, (out.get(k) ?? 0) + (row.metrics[metricName] ?? 0));
  }
  return out;
}

const byVisitorsDesc = <T extends { visitors: number }>(a: T, b: T) => b.visitors - a.visitors;

export function parseReport<R extends ReportName>(
  report: R,
  response: RunReportResponse,
  window: RangeWindow,
): Payload<R> {
  const rows = readRows(response);
  return parsers[report](rows, window) as Payload<R>;
}

const parsers: { [R in ReportName]: (rows: Row[], window: RangeWindow) => Payload<R> } = {
  totals(rows) {
    const out = { current: zeroTotals(), previous: zeroTotals() };
    for (const row of rows) {
      const t = out[row.period];
      t.visitors += row.metrics.activeUsers ?? 0;
      t.pageViews += row.metrics.screenPageViews ?? 0;
      t.engagementSeconds += row.metrics.userEngagementDuration ?? 0;
    }
    return out;
  },

  series(rows, window) {
    const values = sumBy(rows, (r) => r.dims[window.granularity] ?? "", "activeUsers");
    // GA4 leaves out empty hours and days, so every expected point is filled in.
    let points = seriesKeys(window).map((key) => ({ key, visitors: values.get(key) ?? 0 }));
    if (window.granularity === "dateHour" && window.endsToday) {
      // Google adds today's visits a few hours late. The latest hours it hasn't reported
      // yet are left off rather than drawn as zeros.
      const last = points.findLastIndex((p) => values.has(p.key));
      points = points.slice(0, last + 1);
    } else if (window.endsToday && !values.has(points.at(-1)?.key ?? "")) {
      // The same for a range that ends today: no row for today yet means Google hasn't
      // reported it, not zero visitors.
      points = points.slice(0, -1);
    }
    return { granularity: window.granularity, points };
  },

  sources(rows) {
    const current = sumBy(rows, (r) => r.dims.sessionSource ?? "", "activeUsers", "current");
    const previous = sumBy(rows, (r) => r.dims.sessionSource ?? "", "activeUsers", "previous");
    const names = new Set([...current.keys(), ...previous.keys()]);
    const list = [...names].map((source) => ({
      source,
      label: sourceLabel(source),
      visitors: current.get(source) ?? 0,
      previous: previous.get(source) ?? 0,
    }));
    return {
      rows: list.sort((a, b) => b.visitors - a.visitors || b.previous - a.previous).slice(0, 50),
    };
  },

  channels(rows) {
    const values = sumBy(rows, (r) => r.dims.sessionDefaultChannelGroup ?? "", "activeUsers");
    // Several GA4 channels can share one plain label (e.g. the paid ones), so merge by label.
    const byLabel = new Map<string, { channel: string; label: string; visitors: number }>();
    for (const [channel, visitors] of values) {
      const label = channelLabel(channel);
      const entry = byLabel.get(label) ?? { channel, label, visitors: 0 };
      entry.visitors += visitors;
      byLabel.set(label, entry);
    }
    return { rows: [...byLabel.values()].sort(byVisitorsDesc) };
  },

  pages(rows) {
    return {
      rows: rows
        .map((r) => ({
          path: r.dims.pagePath ?? "",
          views: r.metrics.screenPageViews ?? 0,
          visitors: r.metrics.activeUsers ?? 0,
        }))
        .sort((a, b) => b.views - a.views),
    };
  },

  landing(rows) {
    // "(not set)" and an empty path both read "Unknown", so merge by the shown path.
    const values = sumBy(rows, (r) => plainValue(r.dims.landingPage), "activeUsers");
    return {
      rows: [...values].map(([path, visitors]) => ({ path, visitors })).sort(byVisitorsDesc),
    };
  },

  countries(rows) {
    return {
      rows: rows
        .map((r) => ({
          code: (r.dims.countryId ?? "").toUpperCase(),
          name: plainValue(r.dims.country),
          visitors: r.metrics.activeUsers ?? 0,
        }))
        .sort(byVisitorsDesc),
    };
  },

  devices(rows) {
    const values = sumBy(rows, (r) => deviceOf(r.dims.deviceCategory ?? ""), "activeUsers");
    return {
      rows: [...values]
        .map(([device, visitors]) => ({ device, label: DEVICE_LABELS[device], visitors }))
        .sort(byVisitorsDesc),
    };
  },

  actions(rows) {
    return {
      current: Object.fromEntries(
        sumBy(rows, (r) => r.dims.eventName ?? "", "eventCount", "current"),
      ),
      previous: Object.fromEntries(
        sumBy(rows, (r) => r.dims.eventName ?? "", "eventCount", "previous"),
      ),
    };
  },

  ai_sources(rows) {
    const values = sumBy(rows, (r) => aiAssistantName(r.dims.sessionSource ?? ""), "activeUsers");
    return {
      rows: [...values]
        .map(([assistant, visitors]) => ({ assistant, visitors }))
        .sort(byVisitorsDesc),
    };
  },

  ai_pages(rows) {
    // "(not set)" and an empty path both read "Unknown", so merge by the shown path.
    const values = sumBy(rows, (r) => plainValue(r.dims.landingPage), "activeUsers");
    return {
      rows: [...values].map(([path, visitors]) => ({ path, visitors })).sort(byVisitorsDesc),
    };
  },

  browsers(rows) {
    return {
      rows: mergeByLabel(rows, "browser", browserLabel).map(([browser, label, visitors]) => ({
        browser,
        label,
        visitors,
      })),
    };
  },

  systems(rows) {
    return {
      rows: mergeByLabel(rows, "operatingSystem", systemLabel).map(([os, label, visitors]) => ({
        os,
        label,
        visitors,
      })),
    };
  },

  search_landing(rows) {
    const values = sumBy(rows, (r) => r.dims.landingPage ?? "", "activeUsers");
    values.delete("(not set)");
    return {
      rows: [...values].map(([path, visitors]) => ({ path, visitors })).sort(byVisitorsDesc),
      complete: rows.length < SEARCH_LANDING_LIMIT,
    };
  },

  search_signups(rows) {
    const values = sumBy(rows, (r) => r.dims.landingPage ?? "", "eventCount");
    values.delete("(not set)");
    return {
      rows: [...values]
        .map(([path, signups]) => ({ path, signups }))
        .sort((a, b) => b.signups - a.signups),
      complete: rows.length < SEARCH_LANDING_LIMIT,
    };
  },

  goals_sources(rows) {
    return {
      rows: [...eventsBy(rows, (r) => r.dims.sessionSource ?? "")].map(([source, events]) => ({
        source,
        label: sourceLabel(source),
        events,
      })),
    };
  },

  goals_landing(rows) {
    const byPath = eventsBy(rows, (r) => plainValue(r.dims.landingPage));
    return { rows: [...byPath].map(([path, events]) => ({ path, events })) };
  },

  first_goals(rows) {
    return {
      rows: [...eventsBy(rows, (r) => r.dims.firstUserSource ?? "")].map(([source, events]) => ({
        source,
        label: sourceLabel(source),
        events,
      })),
    };
  },

  goal_paths(rows) {
    return {
      rows: [...eventsBy(rows, pathKey)].map(([key, events]) => ({ ...splitPath(key), events })),
      complete: rows.length < SALES_LIMIT,
    };
  },

  goal_days(rows) {
    const events: Record<string, DayBuckets> = {};
    for (const r of rows) {
      const name = r.dims.eventName ?? "";
      events[name] ??= emptyBuckets();
      addToBucket(events[name], r, r.metrics.eventCount ?? 0);
    }
    return { events, complete: rows.length < DAYS_LIMIT };
  },

  sale_page_sources(rows) {
    return { rows: viewsBySource(rows, "sessionSource") };
  },

  first_sale_page(rows) {
    return { rows: viewsBySource(rows, "firstUserSource") };
  },

  sale_page_paths(rows) {
    const values = sumBy(rows, pathKey, "screenPageViews");
    return {
      rows: [...values]
        .map(([key, views]) => ({ ...splitPath(key), views }))
        .sort((a, b) => b.views - a.views),
      complete: rows.length < SALES_LIMIT,
    };
  },

  sale_page_days(rows) {
    const days = emptyBuckets();
    for (const r of rows) addToBucket(days, r, r.metrics.screenPageViews ?? 0);
    return { days, complete: rows.length < DAYS_LIMIT };
  },

  sale_page_landing(rows) {
    const values = sumBy(rows, (r) => plainValue(r.dims.landingPage), "screenPageViews");
    return {
      rows: [...values].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views),
    };
  },

  purchase_sources(rows) {
    return revenueBySource(rows, "sessionSource");
  },

  change_paths(rows) {
    return { rows: changeCells(rows, "activeUsers"), complete: rows.length < CHANGE_LIMIT };
  },

  change_goals(rows) {
    const cells = new Map<string, { now: Record<string, number>; then: Record<string, number> }>();
    for (const r of rows) {
      const key = cellKey(r);
      const cell = cells.get(key) ?? { now: {}, then: {} };
      const side = r.period === "current" ? cell.now : cell.then;
      const name = r.dims.eventName ?? "";
      side[name] = (side[name] ?? 0) + (r.metrics.eventCount ?? 0);
      cells.set(key, cell);
    }
    return {
      rows: [...cells].map(([key, cell]) => ({ ...splitCell(key), ...cell })),
      complete: rows.length < CHANGE_LIMIT,
    };
  },

  change_sale_page(rows) {
    return { rows: changeCells(rows, "screenPageViews"), complete: rows.length < CHANGE_LIMIT };
  },

  first_purchase(rows) {
    return revenueBySource(rows, "firstUserSource");
  },

  purchase_landing(rows) {
    const values = sumBy(rows, (r) => plainValue(r.dims.landingPage), "purchaseRevenue");
    const list = [...values]
      .filter(([, revenue]) => revenue > 0)
      .map(([path, revenue]) => ({ path, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
    return { rows: list, total: list.reduce((a, r) => a + r.revenue, 0) };
  },

  cities(rows) {
    // A city name alone isn't unique (Paris, Texas), so it's kept with its country.
    // Cities Google couldn't place are one "Unknown" row, whatever their country.
    const values = sumBy(
      rows,
      (r) => {
        const city = plainValue(r.dims.city);
        return city === "Unknown"
          ? "|Unknown"
          : `${(r.dims.countryId ?? "").toUpperCase()}|${city}`;
      },
      "activeUsers",
    );
    return {
      rows: [...values]
        .map(([key, visitors]) => {
          const [code, city] = key.split("|") as [string, string];
          return { city, code, visitors };
        })
        .sort(byVisitorsDesc),
    };
  },
};

/** Event counts per key and event name. */
function eventsBy(rows: Row[], key: (row: Row) => string): Map<string, Record<string, number>> {
  const out = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const k = key(r);
    const events = out.get(k) ?? {};
    const name = r.dims.eventName ?? "";
    events[name] = (events[name] ?? 0) + (r.metrics.eventCount ?? 0);
    out.set(k, events);
  }
  return out;
}

function viewsBySource(rows: Row[], field: "sessionSource" | "firstUserSource") {
  const values = sumBy(rows, (r) => r.dims[field] ?? "", "screenPageViews");
  return [...values]
    .map(([source, views]) => ({ source, label: sourceLabel(source), views }))
    .sort((a, b) => b.views - a.views);
}

function revenueBySource(rows: Row[], field: "sessionSource" | "firstUserSource") {
  const values = sumBy(rows, (r) => r.dims[field] ?? "", "purchaseRevenue");
  const list = [...values]
    .filter(([, revenue]) => revenue > 0)
    .map(([source, revenue]) => ({ source, label: sourceLabel(source), revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  return { rows: list, total: list.reduce((a, r) => a + r.revenue, 0) };
}

/** A first source and a last source in one map key (a tab never appears in a source). */
const pathKey = (r: Row) => `${r.dims.firstUserSource ?? ""}\t${r.dims.sessionSource ?? ""}`;

function splitPath(key: string): PathKey {
  const [first = "", last = ""] = key.split("\t");
  return { first, firstLabel: sourceLabel(first), last, lastLabel: sourceLabel(last) };
}

/** A source and a landing page in one map key; the shown path, so "(not set)" reads "Unknown". */
const cellKey = (r: Row) => `${r.dims.sessionSource ?? ""}\t${plainValue(r.dims.landingPage)}`;

function splitCell(key: string): { source: string; path: string } {
  const [source = "", path = ""] = key.split("\t");
  return { source, path };
}

/** One metric per source and landing page, this period and the one before. */
function changeCells(rows: Row[], metricName: string): ChangeCell[] {
  const now = sumBy(rows, cellKey, metricName, "current");
  const then = sumBy(rows, cellKey, metricName, "previous");
  return [...new Set([...now.keys(), ...then.keys()])].map((key) => ({
    ...splitCell(key),
    now: now.get(key) ?? 0,
    then: then.get(key) ?? 0,
  }));
}

const emptyBuckets = (): DayBuckets => ({ sameDay: 0, week: 0, month: 0, later: 0, unknown: 0 });

/** Days between two GA4 dates (YYYYMMDD), or null when either isn't a date. */
export function daysBetween(from: string, to: string): number | null {
  const time = (d: string) =>
    /^\d{8}$/.test(d) ? Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)) : NaN;
  const days = Math.round((time(to) - time(from)) / 86_400_000);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

/** Adds a row's count to its group: same day, 1–7 days, 8–30 days or later. */
function addToBucket(buckets: DayBuckets, row: Row, count: number) {
  const days = daysBetween(row.dims.firstSessionDate ?? "", row.dims.date ?? "");
  if (days === null) buckets.unknown += count;
  else if (days === 0) buckets.sameDay += count;
  else if (days <= 7) buckets.week += count;
  else if (days <= 30) buckets.month += count;
  else buckets.later += count;
}

/**
 * Rows of one dimension summed by their plain-words label (several GA4 values can
 * read the same), biggest first: [first GA4 value, label, visitors].
 */
function mergeByLabel(
  rows: Row[],
  field: string,
  label: (value: string) => string,
): [string, string, number][] {
  const byLabel = new Map<string, [string, string, number]>();
  for (const row of rows) {
    const value = row.dims[field] ?? "";
    const name = label(value);
    const entry = byLabel.get(name) ?? [value, name, 0];
    entry[2] += row.metrics.activeUsers ?? 0;
    byLabel.set(name, entry);
  }
  return [...byLabel.values()].sort((a, b) => b[2] - a[2]);
}
