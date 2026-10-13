import { addDays } from "@/lib/ga4/ranges";
import { sampleReports } from "@/lib/ga4/sample/sample";
import { rangeWindow } from "@/lib/ga4/ranges";
import { brandPattern, brandTerms } from "./brand";
import { parseSearch, type ScResponse, type SearchContext } from "./reports";
import type { SearchCard } from "./data";
import { searchWindow } from "./window";

/**
 * Sample Google search data shaped like a small SaaS site's, for the dev previews.
 * Built by running the real parsers over made-up Search Console rows, so the previews
 * show exactly what the code does with real ones. Deterministic.
 */

const SITE = "https://yoursite.com";

/** [search, page, impressions, clicks, position] this period and the one before. */
const QUERIES: [string, string, [number, number, number], [number, number, number]][] = [
  ["yoursite", "/", [2100, 980, 1.1], [1800, 860, 1.1]],
  ["yoursite pricing", "/pricing", [420, 210, 1.3], [350, 170, 1.4]],
  ["yoursite login", "/", [380, 260, 1.2], [360, 250, 1.2]],
  ["ga4 dashboard", "/pricing", [3200, 14, 11.2], [2600, 9, 12.8]],
  ["simple ga4 dashboard", "/", [1450, 22, 9.4], [900, 11, 13.6]],
  ["google analytics alternative", "/blog/ga4-without-the-confusion", [5400, 61, 8.6], [5100, 140, 5.2]],
  ["ga4 too complicated", "/blog/ga4-without-the-confusion", [1900, 160, 3.4], [600, 30, 9.1]],
  ["ga4 for beginners", "/blog/ga4-without-the-confusion", [2600, 240, 2.9], [2400, 96, 6.4]],
  ["ga4 explained", "/blog/ga4-without-the-confusion", [980, 9, 13.1], [1100, 12, 12.2]],
  ["seo for small sites", "/blog/seo-for-small-sites", [3100, 12, 14.4], [2900, 48, 9.9]],
  ["seo checklist small business", "/blog/seo-for-small-sites", [1200, 8, 10.6], [700, 2, 18.2]],
  ["indie launch checklist", "/blog/indie-launch-checklist", [860, 92, 2.4], [400, 30, 3.8]],
  ["product hunt launch checklist", "/blog/indie-launch-checklist", [1700, 18, 9.9], [1500, 21, 9.4]],
  ["analytics dashboard for startups", "/", [2300, 12, 15.2], [1800, 6, 19.4]],
  ["public analytics page", "/docs/getting-started", [640, 44, 4.1], [520, 39, 4.3]],
  ["share analytics publicly", "/docs/getting-started", [1600, 4, 4.6], [1400, 5, 4.8]],
  ["ga4 weekly email report", "/", [900, 7, 12.6], [300, 1, 21.4]],
  ["ai traffic google analytics", "/blog/ga4-without-the-confusion", [2200, 31, 7.2], [400, 4, 15.1]],
  ["chatgpt referral traffic ga4", "/blog/ga4-without-the-confusion", [760, 12, 8.8], [90, 0, 24]],
  ["changelog template", "/changelog", [450, 1, 18.6], [520, 2, 17.9]],
  ["small site seo tips", "/blog/seo-for-small-sites", [700, 3, 12.2], [800, 19, 6.1]],
  ["who makes yoursite", "/about", [900, 40, 4.3], [850, 36, 4.4]],
  ["ga4 dashboard features", "/features", [1200, 55, 5.2], [1000, 41, 5.6]],
];

/** Page totals: what the page rows add up to, plus the searches Google hides (about 12%). */
function pages(index: 1 | 2) {
  const byPage = new Map<string, { clicks: number; impressions: number; weighted: number }>();
  for (const q of QUERIES) {
    const [imp, clicks, pos] = q[index + 1] as [number, number, number];
    const p = byPage.get(q[1]) ?? { clicks: 0, impressions: 0, weighted: 0 };
    p.clicks += Math.round(clicks * 1.12);
    p.impressions += Math.round(imp * 1.12);
    p.weighted += pos * imp;
    byPage.set(q[1], p);
  }
  // A page Google shows a lot near the top that almost nobody clicks.
  byPage.set("/docs/api", { clicks: 3, impressions: 2800, weighted: 4.4 * 2800 });
  return [...byPage].map(([page, p]) => ({
    keys: [`${SITE}${page}`],
    clicks: p.clicks,
    impressions: p.impressions,
    position: p.weighted / p.impressions,
  }));
}

function queryRows(index: 1 | 2) {
  return QUERIES.map((q) => {
    const [impressions, clicks, position] = q[index + 1] as [number, number, number];
    return { keys: [q[0], `${SITE}${q[1]}`], clicks, impressions, position };
  });
}

/** The sample site's Google search card for a dashboard range ending `end`. */
export function sampleSearchCard(
  range: { start: string; end: string },
  options: { signupEvent?: string | null } = {},
): Extract<SearchCard, { kind: "ready" }> {
  const window = searchWindow(range, addDays(range.end, -2));
  const terms = brandTerms("yoursite.com");
  const ctx: SearchContext = {
    window,
    domain: "yoursite.com",
    pageFilter: null,
    terms,
    brand: brandPattern(terms),
  };
  const sum = (rows: { clicks: number; impressions: number }[]) => ({
    clicks: rows.reduce((a, r) => a + r.clicks, 0),
    impressions: rows.reduce((a, r) => a + r.impressions, 0),
  });
  const now = sum(pages(1));
  const then = sum(pages(2));
  const scale = window.days / 28;
  const days: ScResponse = {
    rows: Array.from({ length: window.days }, (_, i) => {
      const date = addDays(window.current.start, i);
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      const quiet = weekday === 0 || weekday === 6 ? 0.7 : 1.08;
      return {
        keys: [date],
        clicks: Math.round((now.clicks / window.days) * quiet * scale * 4),
        impressions: Math.round((now.impressions / window.days) * quiet * scale * 4),
      };
    }),
  };
  const brandNow = QUERIES.filter((q) => q[0].includes("yoursite")).reduce((a, q) => a + q[2][1], 0);
  const brandThen = QUERIES.filter((q) => q[0].includes("yoursite")).reduce((a, q) => a + q[3][1], 0);
  const otherNow = QUERIES.filter((q) => !q[0].includes("yoursite")).reduce((a, q) => a + q[2][1], 0);
  const otherThen = QUERIES.filter((q) => !q[0].includes("yoursite")).reduce((a, q) => a + q[3][1], 0);
  const perDay = (total: number, i: number) =>
    Math.round((total / window.days) * (0.75 + ((i * 37) % 10) / 20) * scale * 4);

  const overview = parseSearch(
    "search_overview",
    [
      { rows: [{ ...now, clicks: Math.round(now.clicks * scale * 4), impressions: Math.round(now.impressions * scale * 4), position: 7.4 }] },
      { rows: [{ ...then, clicks: Math.round(then.clicks * scale * 4), impressions: Math.round(then.impressions * scale * 4), position: 8.1 }] },
      days,
    ],
    ctx,
  );
  const insights = parseSearch(
    "search_insights",
    [{ rows: queryRows(1) }, { rows: queryRows(2) }, { rows: pages(1) }, { rows: pages(2) }],
    ctx,
  );
  const brand = parseSearch(
    "search_brand",
    [
      { rows: Array.from({ length: window.days }, (_, i) => ({ keys: [addDays(window.current.start, i)], clicks: perDay(brandNow, i) })) },
      { rows: Array.from({ length: window.days }, (_, i) => ({ keys: [addDays(window.current.start, i)], clicks: perDay(otherNow, i + 3) })) },
      { rows: [{ clicks: Math.round(brandThen * scale * 4) }] },
      { rows: [{ clicks: Math.round(otherThen * scale * 4) }] },
    ],
    ctx,
  );
  const ga4 = sampleReports(rangeWindow(`${window.current.start}..${window.current.end}`, "UTC"), [
    "search_landing",
    "search_signups",
  ]);
  return {
    kind: "ready",
    window,
    insightsWindow: window,
    brandWindow: window,
    overview,
    insights,
    brand,
    landing: ga4.search_landing.data,
    signups: options.signupEvent === null ? null : ga4.search_signups.data,
    problem: null,
    refreshing: false,
  };
}
