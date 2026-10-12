import {
  formatDayRange,
  formatDuration,
  formatNumber,
  formatPercent,
  percentChange,
} from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import type { RangeWindow } from "@/lib/ga4/ranges";
import type { Payloads } from "@/lib/ga4/reports";
import { buildSummary } from "@/lib/summary/summary";

/** What the Monday email says (docs/SPEC.md section 14). Pure, so it is tested. */

export type WeeklyEmailData = {
  siteLabel: string;
  subject: string;
  preview: string;
  period: string;
  summary: string | null;
  stats: { label: string; value: string; change: number | null }[];
  sources: { label: string; value: string }[];
  pages: { label: string; value: string }[];
  aiVisitors: string | null;
  links: { dashboard: string; settings: string; unsubscribe: string };
};

export type WeeklyEmailInput = {
  siteLabel: string;
  window: RangeWindow;
  totals: Payloads["totals"] | null;
  sources: Payloads["sources"] | null;
  pages: Payloads["pages"] | null;
  actions: Payloads["actions"] | null;
  aiSources: Payloads["ai_sources"] | null;
  signupEvent: string | null;
  comparable: boolean;
  links: WeeklyEmailData["links"];
};

/** The email, or null when there were no visitors in either week (then nothing is sent). */
export function buildWeeklyEmail(input: WeeklyEmailInput): WeeklyEmailData | null {
  const { totals } = input;
  if (!totals || (totals.current.visitors === 0 && totals.previous.visitors === 0)) return null;
  const stats = deriveStats(totals, input.actions, input.signupEvent, input.comparable)!;
  const visitors = totals.current.visitors;
  const change = input.comparable ? percentChange(visitors, totals.previous.visitors) : null;
  const changeWords =
    change === null
      ? ""
      : change === 0
        ? " (no change)"
        : ` (${change > 0 ? "up" : "down"} ${formatPercent(change)})`;
  const subject = `${input.siteLabel}: ${formatNumber(visitors)} ${visitors === 1 ? "visitor" : "visitors"} last week${changeWords}`;
  const summary = buildSummary({
    range: "7d",
    totals,
    sources: input.sources,
    actions: input.actions,
    signupEvent: input.signupEvent,
    comparable: input.comparable,
    audience: "email",
  });
  const ai = (input.aiSources?.rows ?? []).reduce((a, r) => a + r.visitors, 0);

  return {
    siteLabel: input.siteLabel,
    subject,
    preview: summary ?? subject,
    period: formatDayRange(input.window.current.start, input.window.current.end),
    summary,
    stats: [
      {
        label: "Visitors",
        value: formatNumber(stats.visitors.value ?? 0),
        change: stats.visitors.change,
      },
      {
        label: "Page views",
        value: formatNumber(stats.pageViews.value ?? 0),
        change: stats.pageViews.change,
      },
      {
        label: "Avg. time",
        value: stats.avgTime.value === null ? "—" : formatDuration(stats.avgTime.value),
        change: stats.avgTime.change,
      },
      ...(stats.signups && stats.signups.value !== null
        ? [
            {
              label: "Signups",
              value: formatNumber(stats.signups.value),
              change: stats.signups.change,
            },
          ]
        : []),
    ],
    sources: (input.sources?.rows ?? [])
      .filter((r) => r.visitors > 0)
      .slice(0, 3)
      .map((r) => ({ label: r.label, value: formatNumber(r.visitors) })),
    pages: (input.pages?.rows ?? [])
      .filter((r) => r.views > 0)
      .slice(0, 3)
      .map((r) => ({ label: r.path, value: formatNumber(r.views) })),
    aiVisitors: ai > 0 ? formatNumber(ai) : null,
    links: input.links,
  };
}
