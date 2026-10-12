import { channelLabel, sourceLabel } from "@/lib/ga4/labels";
import {
  addDays,
  daysIn,
  endOfMonth,
  keyToDate,
  keyToHour,
  seriesKeys,
  type RangeWindow,
} from "@/lib/ga4/ranges";
import type { Payloads, ReportName } from "@/lib/ga4/reports";

/**
 * Sample data shaped like a small SaaS site (docs/SPEC.md section 12). Used by the
 * landing demo and the "No GA4 property" state, always labelled "Sample data".
 * Deterministic: the same day always gets the same numbers.
 */

export const SAMPLE_SIGNUP_EVENT = "sign_up";
export const SAMPLE_DOMAIN = "yoursite.com";

/** A stable pseudo-random number in [0, 1) for a string. */
function noise(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

const EPOCH = Date.UTC(2026, 0, 1);

/** Visitors on one day: a slow upward trend, quieter weekends, and some noise. */
function dailyVisitors(isoDate: string): number {
  const t = new Date(`${isoDate}T00:00:00Z`);
  const daysSince = (t.getTime() - EPOCH) / 86_400_000;
  const trend = 180 * 1.0012 ** daysSince; // gentle growth, about 50% a year
  const weekday = t.getUTCDay();
  const week = weekday === 0 || weekday === 6 ? 0.68 : 1.04;
  const launch = isoDate.endsWith("-14") ? 1.9 : 1; // a small spike each month
  return Math.max(12, Math.round(trend * week * launch * (0.85 + noise(isoDate) * 0.3)));
}

function periodDays(range: { start: string; end: string }): string[] {
  const out: string[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Unique visitors over a period are fewer than the sum of daily visitors. */
function uniqueVisitors(range: { start: string; end: string }): number {
  const sum = periodDays(range).reduce((acc, d) => acc + dailyVisitors(d), 0);
  const days = daysIn(range);
  const overlap = days <= 7 ? 0.86 : days <= 31 ? 0.78 : 0.7;
  return Math.round(sum * overlap);
}

/** How a day's visitors spread over its hours: quiet at night, busiest in the afternoon. */
const HOUR_WEIGHTS = [
  2, 1.5, 1.2, 1, 1, 1.3, 2, 3, 4.2, 5.2, 5.8, 6.2, 6.4, 6.6, 6.8, 6.6, 6.2, 5.6, 5, 4.6, 4.2, 3.6,
  3, 2.4,
];
const HOUR_TOTAL = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);

/** Visitors in one hour of a day. */
function hourlyVisitors(isoDate: string, hour: number): number {
  const share = (HOUR_WEIGHTS[hour] ?? 0) / HOUR_TOTAL;
  return Math.round(dailyVisitors(isoDate) * share * (0.8 + noise(`${isoDate}h${hour}`) * 0.4));
}

/** The part of the day that has passed by the end of `lastHour`, for "Today" so far. */
function dayShare(lastHour: number): number {
  return HOUR_WEIGHTS.slice(0, lastHour + 1).reduce((a, b) => a + b, 0) / HOUR_TOTAL;
}

function split<T extends string>(total: number, shares: [T, number][]): [T, number][] {
  return shares.map(([name, share]) => [name, Math.round(total * share)]);
}

const SOURCES: [string, number][] = [
  ["google", 0.41],
  ["(direct)", 0.24],
  ["news.ycombinator.com", 0.09],
  ["t.co", 0.06],
  ["reddit.com", 0.05],
  ["chatgpt.com", 0.035],
  ["producthunt.com", 0.03],
  ["bing", 0.025],
  ["github.com", 0.02],
  ["perplexity.ai", 0.012],
  ["duckduckgo", 0.01],
  ["claude.ai", 0.008],
];

const CHANNELS: [string, number][] = [
  ["Organic Search", 0.45],
  ["Direct", 0.24],
  ["Referral", 0.17],
  ["Organic Social", 0.1],
  ["AI Assistant", 0.04],
];

const PAGES: [string, number, number][] = [
  ["/", 0.62, 1.3],
  ["/pricing", 0.21, 1.15],
  ["/blog/ga4-without-the-confusion", 0.16, 1.05],
  ["/docs/getting-started", 0.11, 1.6],
  ["/blog/indie-launch-checklist", 0.08, 1.05],
  ["/changelog", 0.05, 1.2],
  ["/about", 0.03, 1],
  ["/blog/seo-for-small-sites", 0.03, 1.1],
];

const LANDING: [string, number][] = [
  ["/", 0.48],
  ["/blog/ga4-without-the-confusion", 0.17],
  ["/pricing", 0.09],
  ["/blog/indie-launch-checklist", 0.08],
  ["/docs/getting-started", 0.06],
  ["/blog/seo-for-small-sites", 0.04],
];

const COUNTRIES: [string, string, number][] = [
  ["US", "United States", 0.34],
  ["DE", "Germany", 0.1],
  ["GB", "United Kingdom", 0.09],
  ["IN", "India", 0.08],
  ["NL", "Netherlands", 0.05],
  ["FR", "France", 0.05],
  ["CA", "Canada", 0.04],
  ["BR", "Brazil", 0.03],
  ["ES", "Spain", 0.025],
  ["AU", "Australia", 0.02],
  ["SE", "Sweden", 0.015],
  ["PL", "Poland", 0.012],
];

function samplePayload<R extends ReportName>(report: R, window: RangeWindow): Payloads[R] {
  const soFar = window.type === "today" ? dayShare(window.lastHour ?? 23) : 1;
  const current = Math.round(uniqueVisitors(window.current) * soFar);
  const previous = uniqueVisitors(window.previous);
  const payloads: { [K in ReportName]: () => Payloads[K] } = {
    totals: () => ({
      current: {
        visitors: current,
        pageViews: Math.round(current * 2.4),
        engagementSeconds: current * 74,
      },
      previous: {
        visitors: previous,
        pageViews: Math.round(previous * 2.3),
        engagementSeconds: previous * 71,
      },
    }),
    series: () => ({
      granularity: window.granularity,
      points: seriesKeys(window).map((key) => {
        if (window.granularity === "dateHour") {
          return { key, visitors: hourlyVisitors(keyToDate(key), keyToHour(key)) };
        }
        if (window.granularity === "date") return { key, visitors: dailyVisitors(keyToDate(key)) };
        const start = keyToDate(key);
        const monthEnd = endOfMonth(start);
        const end = monthEnd < window.current.end ? monthEnd : window.current.end;
        return { key, visitors: uniqueVisitors({ start, end }) };
      }),
    }),
    sources: () => ({
      rows: SOURCES.map(([source, share]) => ({
        source,
        label: sourceLabel(source),
        visitors: Math.round(current * share),
        previous: Math.round(previous * share * (0.8 + noise(source) * 0.4)),
      })),
    }),
    channels: () => ({
      rows: split(current, CHANNELS).map(([channel, visitors]) => ({
        channel,
        label: channelLabel(channel),
        visitors,
      })),
    }),
    pages: () => ({
      rows: PAGES.map(([path, share, perVisitor]) => ({
        path,
        visitors: Math.round(current * share),
        views: Math.round(current * share * perVisitor * 1.4),
      })),
    }),
    landing: () => ({
      rows: split(current, LANDING).map(([path, visitors]) => ({ path, visitors })),
    }),
    countries: () => ({
      rows: COUNTRIES.map(([code, name, share]) => ({
        code,
        name,
        visitors: Math.round(current * share),
      })),
    }),
    devices: () => ({
      rows: [
        { device: "desktop" as const, label: "Desktop", visitors: Math.round(current * 0.67) },
        { device: "mobile" as const, label: "Mobile", visitors: Math.round(current * 0.31) },
        { device: "tablet" as const, label: "Tablet", visitors: Math.round(current * 0.02) },
      ],
    }),
    actions: () => ({
      current: {
        [SAMPLE_SIGNUP_EVENT]: Math.round(current * 0.031),
        file_download: Math.round(current * 0.012),
        click: Math.round(current * 0.08),
        form_submit: Math.round(current * 0.018),
      },
      previous: {
        [SAMPLE_SIGNUP_EVENT]: Math.round(previous * 0.027),
        file_download: Math.round(previous * 0.011),
        click: Math.round(previous * 0.075),
        form_submit: Math.round(previous * 0.017),
      },
    }),
    ai_sources: () => ({
      rows: [
        { assistant: "ChatGPT", visitors: Math.round(current * 0.035) },
        { assistant: "Perplexity", visitors: Math.round(current * 0.012) },
        { assistant: "Claude", visitors: Math.round(current * 0.008) },
        { assistant: "Gemini", visitors: Math.round(current * 0.004) },
      ],
    }),
    ai_pages: () => ({
      rows: [
        { path: "/blog/ga4-without-the-confusion", visitors: Math.round(current * 0.022) },
        { path: "/", visitors: Math.round(current * 0.019) },
        { path: "/docs/getting-started", visitors: Math.round(current * 0.009) },
      ],
    }),
  };
  return payloads[report]() as Payloads[R];
}

/** Sample reports for a window, in the same shape the cache returns. */
export function sampleReports<R extends ReportName>(
  window: RangeWindow,
  names: readonly R[],
): { [K in R]: { data: Payloads[K]; fetchedAt: null; fresh: true } } {
  return Object.fromEntries(
    names.map((name) => [
      name,
      { data: samplePayload(name, window), fetchedAt: null, fresh: true },
    ]),
  ) as { [K in R]: { data: Payloads[K]; fetchedAt: null; fresh: true } };
}

/** A calm moment on the sample site, for the landing demo and the dev preview. */
export const sampleLive = {
  total: 9,
  minutes: 30,
  places: [
    { lat: 40.71, lng: -74.01, visitors: 2, label: "New York, United States" },
    { lat: 52.52, lng: 13.41, visitors: 2, label: "Berlin, Germany" },
    { lat: 51.51, lng: -0.13, visitors: 1, label: "London, United Kingdom" },
    { lat: 12.97, lng: 77.59, visitors: 1, label: "Bengaluru, India" },
    { lat: 52.37, lng: 4.89, visitors: 1, label: "Amsterdam, Netherlands" },
    { lat: 37.77, lng: -122.42, visitors: 1, label: "San Francisco, United States" },
    { lat: -33.87, lng: 151.21, visitors: 1, label: "Sydney, Australia" },
  ],
  pages: [
    { title: "GA4 without the confusion · Blog", visitors: 3 },
    { title: "Pricing · Your site", visitors: 2 },
    { title: "Home · Your site", visitors: 2 },
    { title: "Getting started · Docs", visitors: 1 },
    { title: "Changelog · Your site", visitors: 1 },
  ],
};
