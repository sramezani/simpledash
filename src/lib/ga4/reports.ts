import type { protos } from "@google-analytics/data";
import { AI_CHANNEL, AI_LIST_VERSION, AI_SOURCES, aiAssistantName } from "./ai-sources";
import {
  channelLabel,
  DEVICE_LABELS,
  deviceOf,
  plainValue,
  sourceLabel,
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
] as const;
export type ReportName = (typeof REPORTS)[number];

/** Events counted by the Actions card. The signup event is added when one is chosen. */
export const ACTION_EVENTS = ["file_download", "click", "form_submit"] as const;

export type ReportParams = { signupEvent: string | null };

// ── Payloads: aggregated rows only, never visitor-level data ──────────────

export type Totals = { visitors: number; pageViews: number; engagementSeconds: number };
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

/** The cache key part for a report's extra inputs (docs/SPEC.md section 9). */
export function paramsKey(report: ReportName, params: ReportParams): string {
  if (report === "actions") return `signup=${params.signupEvent ?? ""}`;
  if (report === "ai_sources" || report === "ai_pages") return `ai=v${AI_LIST_VERSION}`;
  return "-";
}

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
    const points = seriesKeys(window).map((key) => ({ key, visitors: values.get(key) ?? 0 }));
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
};
