import { formatNumber, formatPosition, formatRate } from "@/lib/format";
import { addDays, customDays, lastWeekRange } from "@/lib/ga4/ranges";
import {
  NEAR_POSITIONS,
  pagePath,
  slippingQuery,
  type PageQueries,
  type PageQuery,
  type Unclicked,
} from "./insights";

/**
 * This week's one thing (docs/SPEC.md section 31.3): one page to work on, picked by
 * fixed rules from Search Console's and Google Analytics' own numbers. Pure, so it is
 * tested. The rules say what the numbers show; the steps to take are fixed text.
 */

export type ActionKind = "slipping" | "near" | "unclicked";

export type SearchAction = {
  kind: ActionKind;
  /** The page's address as Search Console has it. */
  page: string;
  path: string;
  label: string;
  /** Signups from Google search visitors who landed here, or null when not known. */
  signups: number | null;
  /** Google clicks to the page in the 28 days. */
  clicks: number;
  /** The search to work on (slipping, close to page 1). */
  query: PageQuery | null;
  /** Seen, not clicked: the page next to the site's own pages at about the same position. */
  unclicked: Pick<Unclicked, "impressions" | "clicks" | "rate" | "siteRate" | "position"> | null;
};

/** A search close to page 1 needs this many views to be worth a week. */
export const NEAR_MIN_IMPRESSIONS = 100;
/** The days the pick looks at, and how long a page that was worked on is left alone. */
export const ACTION_DAYS = 28;

const norm = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/** The chart note for a page worked on: "Worked on /blog/ga4", within the 80 characters. */
export function searchActionNote(path: string): string {
  const text = `Worked on ${path}`;
  return text.length <= 80 ? text : `${text.slice(0, 79)}…`;
}

/** The Monday this week started on, in the site's time zone: the week's cache key. */
export function weekStart(timeZone: string, now: Date = new Date()): string {
  return addDays(customDays(lastWeekRange(timeZone, now))!.end, 1);
}

/**
 * Up to three candidates, best first. Pages that brought signups from Google come
 * first (slipping, then close to page 1, then seen but not clicked); then the same
 * rules for any page, by its Google numbers. One per page; recent work is skipped.
 */
export function weeklyActions(input: {
  pages: PageQueries[];
  unclicked: Unclicked[];
  /** Google search visitors' signups per landing page (GA4), or null without a signup event. */
  signups: { rows: { path: string; signups: number }[]; complete: boolean } | null;
  /** Paths whose action was marked done in the last 28 days. */
  recent: string[];
  limit?: number;
}): SearchAction[] {
  const counted = new Map<string, number>();
  for (const r of input.signups?.rows ?? [])
    counted.set(norm(r.path), (counted.get(norm(r.path)) ?? 0) + r.signups);
  const signupsOf = (path: string) =>
    input.signups ? (counted.get(path) ?? (input.signups.complete ? 0 : null)) : null;
  const recent = new Set(input.recent.map(norm));
  const pages = input.pages.filter((p) => !recent.has(p.path));
  const unclicked = input.unclicked.filter((u) => !recent.has(pagePath(u.page)));

  const nearQuery = (p: PageQueries) =>
    p.queries
      .filter((q) => {
        const at = Math.round(q.position);
        return (
          at >= NEAR_POSITIONS.from &&
          at <= NEAR_POSITIONS.to &&
          q.impressions >= NEAR_MIN_IMPRESSIONS
        );
      })
      .sort((a, b) => b.impressions - a.impressions)[0] ?? null;

  const action = (
    kind: ActionKind,
    p: { page: string; path: string; label: string; clicks: number },
    query: PageQuery | null,
    seen: SearchAction["unclicked"] = null,
  ): SearchAction => ({
    kind,
    page: p.page,
    path: p.path,
    label: p.label,
    signups: signupsOf(p.path),
    clicks: p.clicks,
    query,
    unclicked: seen,
  });

  const out: SearchAction[] = [];
  for (const withSignups of [true, false]) {
    const keep = (path: string) => !withSignups || (signupsOf(path) ?? 0) > 0;
    const bySignups = (a: SearchAction, b: SearchAction) =>
      withSignups ? (b.signups ?? 0) - (a.signups ?? 0) : 0;
    const slipping = pages
      .filter((p) => keep(p.path))
      .flatMap((p) => {
        const q = slippingQuery(p);
        return q ? [action("slipping", p, q)] : [];
      })
      .sort((a, b) => bySignups(a, b) || b.clicks - a.clicks);
    const near = pages
      .filter((p) => keep(p.path))
      .flatMap((p) => {
        const q = nearQuery(p);
        return q ? [action("near", p, q)] : [];
      })
      .sort((a, b) => bySignups(a, b) || b.query!.impressions - a.query!.impressions);
    const seen = unclicked
      .filter((u) => keep(pagePath(u.page)))
      .map((u) =>
        action(
          "unclicked",
          { page: u.page, path: pagePath(u.page), label: u.label, clicks: u.clicks },
          null,
          {
            impressions: u.impressions,
            clicks: u.clicks,
            rate: u.rate,
            siteRate: u.siteRate,
            position: u.position,
          },
        ),
      )
      .sort((a, b) => bySignups(a, b) || b.unclicked!.impressions - a.unclicked!.impressions);
    out.push(...slipping, ...near, ...seen);
  }
  const seenPages = new Set<string>();
  return out
    .filter((a) => {
      if (seenPages.has(a.path)) return false;
      seenPages.add(a.path);
      return true;
    })
    .slice(0, input.limit ?? 3);
}

/**
 * What to do for each kind of pick: fixed steps and our guide. Plain how-to text, the
 * same for every site; it never explains the numbers.
 */
export const ACTION_STEPS: Record<
  ActionKind,
  { steps: string; guide: string; guideLabel: string }
> = {
  slipping: {
    steps:
      "Check the page still answers this search well: bring facts and dates up to date, make the title and first heading match the search, and link to the page from a newer one.",
    guide: "/guides/google-clicks-what-changed",
    guideLabel: "When Google clicks change",
  },
  near: {
    steps:
      "Use the search's words in the title and first heading, add a section that answers it, and link to the page from two of your other pages.",
    guide: "/guides/keywords-close-to-page-1",
    guideLabel: "How to move up to page 1",
  },
  unclicked: {
    steps:
      "Rewrite the title and description Google shows: say what the page gives, in the words people search for.",
    guide: "/guides/low-click-rate-pages",
    guideLabel: "Pages seen but not clicked",
  },
};

const plural = (n: number, one: string, many: string) =>
  `${formatNumber(n)} ${n === 1 ? one : many}`;

/** The facts behind a pick, as short sentences. Numbers only, from Google. */
export function actionFacts(action: SearchAction): string[] {
  const facts: string[] = [];
  const clicks = plural(action.clicks, "click", "clicks");
  if (action.signups !== null && action.signups > 0) {
    facts.push(
      `Brought ${plural(action.signups, "signup", "signups")} from Google search in the last ${ACTION_DAYS} days (${clicks}).`,
    );
  } else if (action.signups === 0) {
    facts.push(`No signups from Google search in the last ${ACTION_DAYS} days; ${clicks}.`);
  } else {
    facts.push(
      `${clicks.replace(/^./, (c) => c.toUpperCase())} from Google in the last ${ACTION_DAYS} days.`,
    );
  }
  const q = action.query;
  if (action.kind === "slipping" && q && q.positionThen !== null) {
    facts.push(
      `“${q.query}” went from position ${formatPosition(q.positionThen)} to ${formatPosition(q.position)}; clicks ${formatNumber(q.clicksThen)} → ${formatNumber(q.clicks)}.`,
    );
  } else if (action.kind === "near" && q) {
    const page = Math.max(1, Math.ceil(Math.round(q.position) / 10));
    facts.push(
      `“${q.query}” sits at position ${formatPosition(q.position)}${page > 1 ? ` (page ${page})` : ""}, seen ${formatNumber(q.impressions)} times, ${plural(q.clicks, "click", "clicks")}.`,
    );
  } else if (action.kind === "unclicked" && action.unclicked) {
    const u = action.unclicked;
    facts.push(
      `Seen ${formatNumber(u.impressions)} times at position ${formatPosition(u.position)} and clicked ${formatRate(u.rate)} of the time; your pages at about that position get ${formatRate(u.siteRate)}.`,
    );
  }
  return facts;
}
