/**
 * The Google search views (docs/SPEC.md section 28.2), worked out from Search
 * Console's own rows. Pure, so it is tested. Exact numbers only: every view compares
 * Google's counts with each other or with the site itself, never with a guess.
 */

export type QueryPageRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  position: number;
};
export type PageRow = { page: string; clicks: number; impressions: number; position: number };

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");

/** A page's path for joining with Google Analytics: no query, no trailing slash. */
export function pagePath(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname;
    try {
      path = decodeURI(path);
    } catch {
      // Keep the encoded path.
    }
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
  } catch {
    return url;
  }
}

/** How a page shows on screen: its path on the site's own host, with the host otherwise. */
export function pageLabel(url: string, domain: string | null): string {
  try {
    const u = new URL(url);
    const path = pagePath(url) + u.search;
    if (!domain || bare(u.hostname) === bare(domain)) return path;
    return `${bare(u.hostname)}${path === "/" ? "" : path}`;
  } catch {
    return url;
  }
}

const byImpressions = <T extends { impressions: number; clicks: number }>(a: T, b: T) =>
  b.impressions - a.impressions || b.clicks - a.clicks;

// ── 1. Close to page 1 ─────────────────────────────────────────────────────

export type NearQuery = { query: string; impressions: number; clicks: number; position: number };
export type NearGroup = { page: string; label: string; impressions: number; queries: NearQuery[] };
export type NearRow = NearQuery & { page: string; label: string };

export const NEAR_POSITIONS = { from: 8, to: 15 } as const;

/**
 * Searches whose average position rounds to 8–15, most seen first, grouped by page
 * (the page seen most comes first). `all` is the flat list for Details.
 */
export function nearPageOne(
  rows: QueryPageRow[],
  domain: string | null,
  limits = { groups: 25, perGroup: 10, all: 300 },
): { groups: NearGroup[]; all: NearRow[]; count: number } {
  const near = rows
    .filter((r) => {
      const p = Math.round(r.position);
      return r.impressions > 0 && p >= NEAR_POSITIONS.from && p <= NEAR_POSITIONS.to;
    })
    .sort(byImpressions);
  const groups = new Map<string, NearGroup>();
  for (const r of near) {
    const group = groups.get(r.page) ?? {
      page: r.page,
      label: pageLabel(r.page, domain),
      impressions: 0,
      queries: [],
    };
    group.impressions += r.impressions;
    group.queries.push({
      query: r.query,
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position,
    });
    groups.set(r.page, group);
  }
  return {
    groups: [...groups.values()]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limits.groups)
      .map((g) => ({ ...g, queries: g.queries.slice(0, limits.perGroup) })),
    all: near.slice(0, limits.all).map((r) => ({
      query: r.query,
      page: r.page,
      label: pageLabel(r.page, domain),
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position,
    })),
    count: near.length,
  };
}

// ── 2. What changed ────────────────────────────────────────────────────────

export type ChangedQuery = {
  query: string;
  clicksNow: number;
  clicksThen: number;
  /** Null when the search didn't show the page in that period. */
  positionNow: number | null;
  positionThen: number | null;
};
export type ChangedPage = {
  page: string;
  label: string;
  clicksNow: number;
  clicksThen: number;
  positionNow: number | null;
  positionThen: number | null;
  /** The searches whose clicks moved the same way, biggest first. */
  queries: ChangedQuery[];
};

/** A change smaller than this is left out: it's noise on small sites. */
export const MIN_CLICK_CHANGE = 3;

/**
 * The pages whose Google clicks rose most and fell most against the period before,
 * each with the searches behind it: clicks and position then and now. Facts only.
 */
export function whatChanged(
  pagesNow: PageRow[],
  pagesThen: PageRow[],
  queriesNow: QueryPageRow[],
  queriesThen: QueryPageRow[],
  domain: string | null,
  limit = 5,
): { rising: ChangedPage[]; falling: ChangedPage[] } {
  const then = new Map(pagesThen.map((p) => [p.page, p]));
  const now = new Map(pagesNow.map((p) => [p.page, p]));
  const pages = [...new Set([...now.keys(), ...then.keys()])].map((page) => {
    const a = now.get(page);
    const b = then.get(page);
    return {
      page,
      label: pageLabel(page, domain),
      clicksNow: a?.clicks ?? 0,
      clicksThen: b?.clicks ?? 0,
      positionNow: a && a.impressions > 0 ? a.position : null,
      positionThen: b && b.impressions > 0 ? b.position : null,
    };
  });
  const delta = (p: { clicksNow: number; clicksThen: number }) => p.clicksNow - p.clicksThen;
  const key = (r: QueryPageRow) => `${r.page}\u0000${r.query}`;
  const qThen = new Map(queriesThen.map((r) => [key(r), r]));
  const qNow = new Map(queriesNow.map((r) => [key(r), r]));

  const withQueries = (p: (typeof pages)[number]): ChangedPage => {
    const direction = Math.sign(delta(p));
    const keys = new Set(
      [...queriesNow, ...queriesThen].filter((r) => r.page === p.page).map(key),
    );
    const queries = [...keys]
      .map((k) => {
        const a = qNow.get(k);
        const b = qThen.get(k);
        return {
          query: (a ?? b)!.query,
          clicksNow: a?.clicks ?? 0,
          clicksThen: b?.clicks ?? 0,
          positionNow: a && a.impressions > 0 ? a.position : null,
          positionThen: b && b.impressions > 0 ? b.position : null,
        };
      })
      .filter((q) => Math.sign(delta(q)) === direction && delta(q) !== 0)
      .sort((x, y) => Math.abs(delta(y)) - Math.abs(delta(x)))
      .slice(0, 5);
    return { ...p, queries };
  };

  const moved = pages.filter((p) => Math.abs(delta(p)) >= MIN_CLICK_CHANGE);
  return {
    rising: moved
      .filter((p) => delta(p) > 0)
      .sort((a, b) => delta(b) - delta(a))
      .slice(0, limit)
      .map(withQueries),
    falling: moved
      .filter((p) => delta(p) < 0)
      .sort((a, b) => delta(a) - delta(b))
      .slice(0, limit)
      .map(withQueries),
  };
}

// ── 4. Seen, not clicked ───────────────────────────────────────────────────

export type PositionGroup = "1" | "2" | "3" | "4–5" | "6–10" | "11–20" | "21+";

/** Pages are compared with the site's own pages at about the same position. */
export function positionGroup(position: number): PositionGroup {
  const p = Math.max(1, Math.round(position));
  if (p <= 3) return String(p) as PositionGroup;
  if (p <= 5) return "4–5";
  if (p <= 10) return "6–10";
  if (p <= 20) return "11–20";
  return "21+";
}

export type Unclicked = {
  page: string;
  label: string;
  impressions: number;
  clicks: number;
  /** This page's click rate, 0–1. */
  rate: number;
  position: number;
  group: PositionGroup;
  /** The click rate of the site's own pages in the same position group, 0–1. */
  siteRate: number;
};

/** A position group needs this much of the site's own data to compare with. */
export const MIN_GROUP = { pages: 3, impressions: 200 } as const;
/** And a page needs this many views to be listed. */
export const MIN_PAGE_IMPRESSIONS = 100;

/**
 * Pages seen often whose click rate is under half of what the site's own pages get
 * at about the same position. Compared with the site itself, never an industry number.
 */
export function seenNotClicked(
  pages: PageRow[],
  domain: string | null,
  limit = 20,
): { pages: Unclicked[]; groups: Partial<Record<PositionGroup, number>> } {
  const sums = new Map<PositionGroup, { pages: number; clicks: number; impressions: number }>();
  for (const p of pages) {
    if (p.impressions <= 0) continue;
    const g = positionGroup(p.position);
    const s = sums.get(g) ?? { pages: 0, clicks: 0, impressions: 0 };
    s.pages++;
    s.clicks += p.clicks;
    s.impressions += p.impressions;
    sums.set(g, s);
  }
  const groups: Partial<Record<PositionGroup, number>> = {};
  for (const [g, s] of sums) {
    if (s.pages >= MIN_GROUP.pages && s.impressions >= MIN_GROUP.impressions) {
      groups[g] = s.clicks / s.impressions;
    }
  }
  const flagged = pages
    .filter((p) => p.impressions >= MIN_PAGE_IMPRESSIONS)
    .flatMap((p): Unclicked[] => {
      const group = positionGroup(p.position);
      const siteRate = groups[group];
      const rate = p.clicks / p.impressions;
      if (siteRate === undefined || siteRate <= 0 || rate >= siteRate / 2) return [];
      return [
        {
          page: p.page,
          label: pageLabel(p.page, domain),
          impressions: p.impressions,
          clicks: p.clicks,
          rate,
          position: p.position,
          group,
          siteRate,
        },
      ];
    })
    .sort(byImpressions)
    .slice(0, limit);
  return { pages: flagged, groups };
}

// ── 5. Searches that lead to signups ───────────────────────────────────────

export type SignupRow = {
  path: string;
  /** Google clicks to the page (Search Console). */
  clicks: number;
  /** Visitors from Google search who landed on it (GA4), or null when GA4's list was cut off. */
  visitors: number | null;
  /** Their signup events (GA4), or null when no signup event is chosen or the list was cut off. */
  signups: number | null;
};

/**
 * Google clicks per landing page next to that page's visitors from Google search and
 * their signups, joined on the page path. A page missing from a complete GA4 list had
 * none; from a list GA4 cut off, it's unknown (null), never a made-up zero.
 */
export function searchesToSignups(
  pages: { page: string; clicks: number }[],
  landing: { rows: { path: string; visitors: number }[]; complete: boolean },
  signups: { rows: { path: string; signups: number }[]; complete: boolean } | null,
  limit = 50,
): SignupRow[] {
  const norm = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
  const visitors = new Map<string, number>();
  for (const r of landing.rows) visitors.set(norm(r.path), (visitors.get(norm(r.path)) ?? 0) + r.visitors);
  const counted = new Map<string, number>();
  for (const r of signups?.rows ?? []) counted.set(norm(r.path), (counted.get(norm(r.path)) ?? 0) + r.signups);
  const clicks = new Map<string, number>();
  for (const p of pages) {
    if (p.clicks <= 0) continue;
    const path = pagePath(p.page);
    clicks.set(path, (clicks.get(path) ?? 0) + p.clicks);
  }
  return [...clicks]
    .map(([path, c]) => ({
      path,
      clicks: c,
      visitors: visitors.get(path) ?? (landing.complete ? 0 : null),
      signups: signups ? (counted.get(path) ?? (signups.complete ? 0 : null)) : null,
    }))
    .sort((a, b) => (b.signups ?? -1) - (a.signups ?? -1) || b.clicks - a.clicks)
    .slice(0, limit);
}
