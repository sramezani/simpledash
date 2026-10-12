import { percentChange } from "@/lib/format";
import type { Payloads } from "./reports";

/** The four numbers (docs/SPEC.md section 11.2), worked out from cached reports. */

export type Stat = {
  /** The value in this period, or null when there is nothing honest to show. */
  value: number | null;
  /** Whole-number % change, or null with a reason. */
  change: number | null;
};

export type Stats = {
  visitors: Stat;
  pageViews: Stat;
  /** Seconds per visitor. */
  avgTime: Stat;
  /** Null when no signup event is chosen: the card never shows a zero then. */
  signups: Stat | null;
  /** Both periods have zero visitors: the "No data yet" state. */
  noData: boolean;
};

export function deriveStats(
  totals: Payloads["totals"] | null,
  actions: Payloads["actions"] | null,
  signupEvent: string | null,
  comparable: boolean,
): Stats | null {
  if (!totals) return null;
  const { current, previous } = totals;
  const change = (now: number, before: number) => (comparable ? percentChange(now, before) : null);
  const perVisitor = (t: Payloads["totals"]["current"]) =>
    t.visitors > 0 ? t.engagementSeconds / t.visitors : null;
  const avgNow = perVisitor(current);
  const avgBefore = perVisitor(previous);

  let signups: Stat | null = null;
  if (signupEvent) {
    const now = actions?.current[signupEvent];
    const before = actions?.previous[signupEvent] ?? 0;
    signups = actions
      ? { value: now ?? 0, change: change(now ?? 0, before) }
      : { value: null, change: null };
  }

  return {
    visitors: { value: current.visitors, change: change(current.visitors, previous.visitors) },
    pageViews: { value: current.pageViews, change: change(current.pageViews, previous.pageViews) },
    avgTime: {
      value: avgNow,
      change: avgNow !== null && avgBefore !== null ? change(avgNow, avgBefore) : null,
    },
    signups,
    noData: current.visitors === 0 && previous.visitors === 0,
  };
}
