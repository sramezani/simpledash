import type { Payloads } from "@/lib/ga4/reports";
import type { PathCount, SourceCounts } from "./highlights";

/**
 * Signups or sales per source by first visit and by last visit, and the paths between
 * them (docs/SPEC.md section 31.1), from GA4's reports. Pure, so it is tested; the card
 * and the Monday email both use it.
 */

export type CustomerData = {
  goalsSources: Payloads["goals_sources"] | null;
  pageSources: Payloads["sale_page_sources"] | null;
  firstGoals: Payloads["first_goals"] | null;
  firstPages: Payloads["first_sale_page"] | null;
  goalPaths: Payloads["goal_paths"] | null;
  pagePaths: Payloads["sale_page_paths"] | null;
};

/** What a metric counts: an event, views of a thank-you page, or both. */
export type MetricSource = { event: string | null; page: string | null };

export type CustomerCounts = {
  /** False when GA4 didn't answer for first visits: only last visits are known. */
  hasFirst: boolean;
  sources: SourceCounts[];
  /** Null when GA4 didn't answer for paths. */
  paths: (PathCount & { firstLabel: string })[] | null;
  /** False when GA4 cut the paths list off, so a total across paths isn't known. */
  pathsComplete: boolean;
};

export function customerCounts(data: CustomerData, metric: MetricSource): CustomerCounts {
  const { event, page } = metric;
  const count = (events: Record<string, number> | undefined) =>
    event ? (events?.[event] ?? 0) : 0;
  const hasFirst = (!event || !!data.firstGoals) && (!page || !!data.firstPages);
  const hasPaths = (!event || !!data.goalPaths) && (!page || !!data.pagePaths);

  const bySource = new Map<string, SourceCounts>();
  const source = (raw: string, label: string) => {
    const found = bySource.get(raw) ?? { source: raw, label, first: 0, last: 0 };
    bySource.set(raw, found);
    return found;
  };
  for (const r of data.goalsSources?.rows ?? []) source(r.source, r.label).last += count(r.events);
  if (page) for (const r of data.pageSources?.rows ?? []) source(r.source, r.label).last += r.views;
  if (hasFirst) {
    for (const r of data.firstGoals?.rows ?? []) source(r.source, r.label).first += count(r.events);
    if (page)
      for (const r of data.firstPages?.rows ?? []) source(r.source, r.label).first += r.views;
  }

  const byPath = new Map<string, PathCount & { firstLabel: string }>();
  const addPath = (
    p: Payloads["goal_paths"]["rows"][number] | Payloads["sale_page_paths"]["rows"][number],
    n: number,
  ) => {
    const key = `${p.first}\t${p.last}`;
    const found = byPath.get(key) ?? {
      first: p.first,
      firstLabel: p.firstLabel,
      last: p.last,
      lastLabel: p.lastLabel,
      count: 0,
    };
    found.count += n;
    byPath.set(key, found);
  };
  if (hasPaths) {
    for (const p of data.goalPaths?.rows ?? []) addPath(p, count(p.events));
    if (page) for (const p of data.pagePaths?.rows ?? []) addPath(p, p.views);
  }

  return {
    hasFirst,
    sources: [...bySource.values()].filter((s) => s.first > 0 || s.last > 0),
    paths: hasPaths
      ? [...byPath.values()].filter((p) => p.count > 0).sort((a, b) => b.count - a.count)
      : null,
    pathsComplete: (!event || !!data.goalPaths?.complete) && (!page || !!data.pagePaths?.complete),
  };
}
