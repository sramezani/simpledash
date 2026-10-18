import { percentChange } from "@/lib/format";
import { sourceLabel } from "@/lib/ga4/labels";
import { pagePath, type ChangedPage } from "@/lib/search-console/insights";

/**
 * What changed and where (docs/SPEC.md section 31.2): which sources moved a number,
 * the landing pages behind each, and for Google, the searches. Pure, so it is tested.
 * Every line is a count from Google, then and now. It never says why.
 */

export type Count = { now: number; then: number };
/** A source or a page, then and now. */
export type ChangeLine = Count & { key: string; label: string; delta: number };
export type Mover = ChangeLine & { pages: ChangeLine[] };
export type Cell = Count & { source: string; path: string };

export type Breakdown = {
  /** The whole number then and now, or null when it can't be known (a list cut off). */
  total: Count | null;
  /** The % change, or null when there was nothing before. */
  change: number | null;
  /** Within ±3%: "about the same". */
  steady: boolean;
  /** The biggest moves, up or down, with their landing pages. */
  movers: Mover[];
  /** Every source that moved, biggest first (Details). */
  all: ChangeLine[];
};

/** A change within this many % reads "about the same" (the same band as the summary line). */
export const STEADY_BAND = 3;
/** Smaller moves are left out: they're noise on small sites. */
export const MIN_CHANGE = { visitors: 3, events: 2 } as const;

const line = (key: string, label: string, c: Count): ChangeLine => ({
  key,
  label,
  now: c.now,
  then: c.then,
  delta: c.now - c.then,
});

const biggest = (a: ChangeLine, b: ChangeLine) =>
  Math.abs(b.delta) - Math.abs(a.delta) || b.now - a.now;

/** Sums cells by source (event counts add up; visitors don't, so those come from `sources`). */
export function sumBySource(cells: Cell[]): { source: string; now: number; then: number }[] {
  const out = new Map<string, Count>();
  for (const c of cells) {
    const found = out.get(c.source) ?? { now: 0, then: 0 };
    found.now += c.now;
    found.then += c.then;
    out.set(c.source, found);
  }
  return [...out].map(([source, c]) => ({ source, ...c }));
}

export function changeBreakdown(input: {
  total: Count | null;
  sources: { source: string; now: number; then: number }[];
  /** Per source and landing page. */
  pages: Cell[];
  min: number;
  limit?: number;
  pagesPerMover?: number;
}): Breakdown {
  const { total, min, limit = 3, pagesPerMover = 3 } = input;
  const change = total ? percentChange(total.now, total.then) : null;
  const all = input.sources
    .map((s) => line(s.source, sourceLabel(s.source), s))
    .filter((s) => Math.abs(s.delta) >= min)
    .sort(biggest);
  const movers = all.slice(0, limit).map((mover) => ({
    ...mover,
    // The pages that moved the same way as their source.
    pages: input.pages
      .filter((p) => p.source === mover.key)
      .map((p) => line(p.path, p.path, p))
      .filter((p) => Math.sign(p.delta) === Math.sign(mover.delta) && Math.abs(p.delta) >= min)
      .sort(biggest)
      .slice(0, pagesPerMover),
  }));
  return {
    total,
    change,
    steady: change !== null && Math.abs(change) < STEADY_BAND,
    movers,
    all,
  };
}

/**
 * Google search's own numbers for a Google move: the first of its landing pages whose
 * Google clicks moved the same way (Search Console's What changed). Null when none did.
 */
export function googleDetail(
  pages: ChangeLine[],
  changed: { rising: ChangedPage[]; falling: ChangedPage[] },
  up: boolean,
): ChangedPage | null {
  const list = up ? changed.rising : changed.falling;
  for (const p of pages) {
    const found = list.find((c) => pagePath(c.page) === p.key);
    if (found) return found;
  }
  return null;
}

export type MetricId = "visitors" | "signups" | "sales";
export type MetricChange = {
  id: MetricId;
  /** "Visitors", for the switch and the headline. */
  label: string;
  breakdown: Breakdown;
  /** Google search's own numbers behind the Google move, when Search Console is connected. */
  google: ChangedPage | null;
};

type Reports = {
  totals: { current: { visitors: number }; previous: { visitors: number } } | null;
  sources: { rows: { source: string; visitors: number; previous: number }[] } | null;
  actions: { current: Record<string, number>; previous: Record<string, number> } | null;
  paths: { rows: Cell[] } | null;
  goals: {
    rows: {
      source: string;
      path: string;
      now: Record<string, number>;
      then: Record<string, number>;
    }[];
    complete: boolean;
  } | null;
  salePageCells: { rows: Cell[]; complete: boolean } | null;
};

/**
 * The card's metrics: Visitors always; Signups and Sales on Pro when they're set up and
 * GA4 answered. Visitors' sources come from the Sources report (visitors don't add up
 * across rows); events add up, so their sources are sums of the source-and-page cells.
 */
export function metricChanges(
  reports: Reports,
  options: {
    signupEvent: string | null;
    saleEvent: string | null;
    salePage: string | null;
    pro: boolean;
    search: { rising: ChangedPage[]; falling: ChangedPage[] } | null;
  },
): MetricChange[] {
  const withGoogle = (id: MetricId, label: string, breakdown: Breakdown): MetricChange => {
    const mover = breakdown.movers.find((m) => m.key === "google");
    const google =
      mover && options.search ? googleDetail(mover.pages, options.search, mover.delta > 0) : null;
    return { id, label, breakdown, google };
  };
  const out: MetricChange[] = [];
  if (reports.totals) {
    out.push(
      withGoogle(
        "visitors",
        "Visitors",
        changeBreakdown({
          total: { now: reports.totals.current.visitors, then: reports.totals.previous.visitors },
          sources: (reports.sources?.rows ?? []).map((r) => ({
            source: r.source,
            now: r.visitors,
            then: r.previous,
          })),
          pages: reports.paths?.rows ?? [],
          min: MIN_CHANGE.visitors,
        }),
      ),
    );
  }
  if (!options.pro || !reports.goals) return out;
  const goals = reports.goals;
  const cells = (event: string): Cell[] =>
    goals.rows.map((r) => ({
      source: r.source,
      path: r.path,
      now: r.now[event] ?? 0,
      then: r.then[event] ?? 0,
    }));

  const signup = options.signupEvent;
  if (signup) {
    const signupCells = cells(signup);
    const now = reports.actions?.current[signup];
    const then = reports.actions?.previous[signup];
    out.push(
      withGoogle(
        "signups",
        "Signups",
        changeBreakdown({
          total:
            now !== undefined || then !== undefined ? { now: now ?? 0, then: then ?? 0 } : null,
          sources: sumBySource(signupCells),
          pages: signupCells,
          min: MIN_CHANGE.events,
        }),
      ),
    );
  }

  if (options.saleEvent || options.salePage) {
    const pageCells = options.salePage ? (reports.salePageCells?.rows ?? null) : [];
    if (pageCells !== null) {
      const saleCells = [...(options.saleEvent ? cells(options.saleEvent) : []), ...pageCells];
      const complete =
        (!options.saleEvent || goals.complete) &&
        (!options.salePage || !!reports.salePageCells?.complete);
      const total = saleCells.reduce((a, c) => ({ now: a.now + c.now, then: a.then + c.then }), {
        now: 0,
        then: 0,
      });
      out.push(
        withGoogle(
          "sales",
          "Sales",
          changeBreakdown({
            total: complete ? total : null,
            sources: sumBySource(saleCells),
            pages: saleCells,
            min: MIN_CHANGE.events,
          }),
        ),
      );
    }
  }
  return out;
}
