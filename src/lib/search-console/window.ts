import { addDays, daysIn, todayIn, type DateRange } from "@/lib/ga4/ranges";

/**
 * Which days to ask Search Console for (docs/SPEC.md section 28.2). Pure, so it is
 * tested. Search Console counts days in California time, is usually 2–3 days behind,
 * and keeps 16 months.
 */

export const SEARCH_TIME_ZONE = "America/Los_Angeles";
const HISTORY_MONTHS = 16;
const PROBE_DAYS = 10;

export type SearchWindow = {
  current: DateRange;
  previous: DateRange;
  /** Days in each period. */
  days: number;
  /** Moved back to end on Google's newest finished day. */
  shifted: boolean;
  /** The current period would start before Search Console's 16 months, so it starts later. */
  clipped: boolean;
  /** The period before reaches past the 16 months, so there is no honest comparison. */
  comparable: boolean;
  /** Google's newest finished day. */
  latestDay: string;
};

/** The day 16 months before `day` (on or after the true limit, so it never asks for missing days). */
export function historyStart(day: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1 - HISTORY_MONTHS, Math.min(d, 28)));
  return date.toISOString().slice(0, 10);
}

/**
 * The dashboard's period as Search Console days: moved back so it ends on Google's
 * newest finished day, keeping its length; the period before is the same length just
 * before it. Nothing earlier than Search Console's 16 months is asked for.
 */
export function searchWindow(period: DateRange, latestDay: string): SearchWindow {
  const days = daysIn(period);
  const shifted = period.end > latestDay;
  const end = shifted ? latestDay : period.end;
  const limit = historyStart(latestDay);
  let start = shifted ? addDays(end, -(days - 1)) : period.start;
  const clipped = start < limit;
  if (clipped) start = limit;
  const length = daysIn({ start, end });
  const previous = { start: addDays(start, -length), end: addDays(start, -1) };
  return {
    current: { start, end },
    previous,
    days: length,
    shifted,
    clipped,
    comparable: !clipped && previous.start >= limit,
    latestDay,
  };
}

/** The days to look at to find Google's newest finished day: the last 10, California time. */
export function latestProbe(now: Date = new Date()): DateRange {
  const today = todayIn(SEARCH_TIME_ZONE, now);
  return { start: addDays(today, -PROBE_DAYS), end: today };
}

/**
 * Google's newest finished day, from a query grouped by date over the probe days.
 * With no rows (a new or quiet property), 3 days ago, Google's usual delay.
 */
export function newestDay(dates: string[], now: Date = new Date()): string {
  const latest = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1);
  return latest ?? addDays(todayIn(SEARCH_TIME_ZONE, now), -3);
}
