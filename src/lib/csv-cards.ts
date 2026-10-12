import type { CardId } from "@/config/cards";
import type { RangeWindow } from "@/lib/ga4/ranges";
import type { Payloads, ReportName } from "@/lib/ga4/reports";

/** Which reports each CSV needs, and how its rows are written (docs/SPEC.md section 13). */

export const csvReports: Partial<Record<CardId, ReportName[]>> = {
  visitors: ["totals"],
  "page-views": ["totals"],
  "avg-time": ["totals"],
  signups: ["actions"],
  chart: ["series"],
  sources: ["sources", "channels"],
  ai: ["ai_sources", "ai_pages"],
  pages: ["pages", "landing"],
  countries: ["countries"],
  devices: ["devices"],
  actions: ["actions"],
};

type Data = { [R in ReportName]?: Payloads[R] | null };
type Table = { header: string[]; rows: (string | number | null)[][] };

export function csvTable(
  card: CardId,
  data: Data,
  window: RangeWindow,
  signupEvent: string | null,
): Table | null {
  const period = (which: "current" | "previous") => [
    which === "current" ? "This period" : "Previous period",
    window[which].start,
    window[which].end,
  ];
  const totals = data.totals ?? null;
  const stat = (
    pick: (t: Payloads["totals"]["current"]) => number | null,
    label: string,
  ): Table | null =>
    totals
      ? {
          header: ["Period", "Start", "End", label],
          rows: (["current", "previous"] as const).map((p) => [...period(p), pick(totals[p])]),
        }
      : null;

  switch (card) {
    case "visitors":
      return stat((t) => t.visitors, "Visitors");
    case "page-views":
      return stat((t) => t.pageViews, "Page views");
    case "avg-time":
      return stat(
        (t) => (t.visitors > 0 ? Math.round(t.engagementSeconds / t.visitors) : null),
        "Avg. time (seconds)",
      );
    case "signups": {
      const actions = data.actions;
      if (!signupEvent || !actions) return null;
      return {
        header: ["Period", "Start", "End", `Signups (${signupEvent})`],
        rows: (["current", "previous"] as const).map((p) => [
          ...period(p),
          actions[p][signupEvent] ?? 0,
        ]),
      };
    }
    case "chart":
      return data.series
        ? {
            header: ["Date", "Visitors"],
            rows: data.series.points.map((p) => [keyToIso(p.key), p.visitors]),
          }
        : null;
    case "sources":
      if (!data.sources) return null;
      return {
        header: ["Type", "Name", "Visitors", "Visitors in the previous period"],
        rows: [
          ...data.sources.rows.map((r) => ["Source", r.label, r.visitors, r.previous]),
          ...(data.channels?.rows ?? []).map((r) => ["Channel", r.label, r.visitors, null]),
        ],
      };
    case "ai":
      if (!data.ai_sources) return null;
      return {
        header: ["Type", "Name", "Visitors"],
        rows: [
          ...data.ai_sources.rows.map((r) => ["Assistant", r.assistant, r.visitors]),
          ...(data.ai_pages?.rows ?? []).map((r) => ["Landing page", r.path, r.visitors]),
        ],
      };
    case "pages":
      if (!data.pages) return null;
      return {
        header: ["Type", "Path", "Views", "Visitors"],
        rows: [
          ...data.pages.rows.map((r) => ["Page", r.path, r.views, r.visitors]),
          ...(data.landing?.rows ?? []).map((r) => ["Landing page", r.path, null, r.visitors]),
        ],
      };
    case "countries":
      return data.countries
        ? {
            header: ["Country", "Code", "Visitors"],
            rows: data.countries.rows.map((r) => [r.name, r.code, r.visitors]),
          }
        : null;
    case "devices":
      return data.devices
        ? {
            header: ["Device", "Visitors"],
            rows: data.devices.rows.map((r) => [r.label, r.visitors]),
          }
        : null;
    case "actions": {
      const actions = data.actions;
      if (!actions) return null;
      const names = [
        ...new Set([...Object.keys(actions.current), ...Object.keys(actions.previous)]),
      ].sort();
      return {
        header: ["Event", "Count", "Count in the previous period"],
        rows: names.map((n) => [n, actions.current[n] ?? 0, actions.previous[n] ?? 0]),
      };
    }
    default:
      return null;
  }
}

/** "20261004" → "2026-10-04", "202610" → "2026-10". */
function keyToIso(key: string): string {
  return key.length === 8
    ? `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6)}`
    : `${key.slice(0, 4)}-${key.slice(4, 6)}`;
}
