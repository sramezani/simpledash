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

/**
 * What the Monday email says (docs/SPEC.md sections 14 and 28.1): one email per
 * account, one block per site. Pure, so it is tested.
 */

export type SiteBlock = {
  siteLabel: string;
  period: string;
  summary: string | null;
  stats: { label: string; value: string; change: number | null }[];
  sources: { label: string; value: string }[];
  pages: { label: string; value: string }[];
  aiVisitors: string | null;
  /** This site's dashboard. */
  dashboard: string;
  /** For the subject: last week's visitors and the change, when it can be compared. */
  visitors: number;
  change: number | null;
};

export type WeeklyEmailData = {
  subject: string;
  preview: string;
  blocks: SiteBlock[];
  links: { settings: string; unsubscribe: string };
};

export type SiteWeekInput = {
  siteLabel: string;
  window: RangeWindow;
  totals: Payloads["totals"] | null;
  sources: Payloads["sources"] | null;
  pages: Payloads["pages"] | null;
  actions: Payloads["actions"] | null;
  aiSources: Payloads["ai_sources"] | null;
  signupEvent: string | null;
  comparable: boolean;
  dashboard: string;
};

export type WeeklyEmailInput = {
  /** The account's sites, the main one first. */
  sites: SiteWeekInput[];
  links: WeeklyEmailData["links"];
};

/** One site's block, or null when it had no visitors in either week (it is left out). */
export function buildSiteBlock(input: SiteWeekInput): SiteBlock | null {
  const { totals } = input;
  if (!totals || (totals.current.visitors === 0 && totals.previous.visitors === 0)) return null;
  const stats = deriveStats(totals, input.actions, input.signupEvent, input.comparable)!;
  const visitors = totals.current.visitors;
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
    dashboard: input.dashboard,
    visitors,
    change: input.comparable ? percentChange(visitors, totals.previous.visitors) : null,
  };
}

/** " (up 23%)", " (no change)", or nothing when it can't be compared. */
function changeWords(change: number | null): string {
  if (change === null) return "";
  if (change === 0) return " (no change)";
  return ` (${change > 0 ? "up" : "down"} ${formatPercent(change)})`;
}

const visitorWord = (n: number) => (n === 1 ? "visitor" : "visitors");

/**
 * The subject: "mysite.com: 1,234 visitors last week (up 23%)" for one site;
 * "Last week: mysite.com 1,234 visitors (up 23%), and 2 more sites" for several.
 */
export function weeklySubject(blocks: SiteBlock[]): string {
  const [first] = blocks;
  if (!first) return "";
  const count = `${formatNumber(first.visitors)} ${visitorWord(first.visitors)}`;
  if (blocks.length === 1) {
    return `${first.siteLabel}: ${count} last week${changeWords(first.change)}`;
  }
  const more = blocks.length - 1;
  return `Last week: ${first.siteLabel} ${count}${changeWords(first.change)}, and ${more} more ${more === 1 ? "site" : "sites"}`;
}

/** The email, or null when no site had visitors in either week (then nothing is sent). */
export function buildWeeklyEmail(input: WeeklyEmailInput): WeeklyEmailData | null {
  const blocks = input.sites.map(buildSiteBlock).filter((b): b is SiteBlock => b !== null);
  if (blocks.length === 0) return null;
  const subject = weeklySubject(blocks);
  return { subject, preview: blocks[0]!.summary ?? subject, blocks, links: input.links };
}
