/**
 * Date ranges and comparisons (docs/SPEC.md section 8). All dates are calendar
 * dates (YYYY-MM-DD) in the site's GA4 time zone, worked out with Intl and
 * plain date arithmetic. Ranges are full days ending yesterday.
 */

export const RANGE_TYPES = ["7d", "30d", "12m"] as const;
export type RangeType = (typeof RANGE_TYPES)[number];
export const DEFAULT_RANGE: RangeType = "7d";

export const RANGE_LABELS: Record<RangeType, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "12m": "12 months",
};

/** "the previous 7 days", used by the summary line. */
export const PREVIOUS_PERIOD_WORDS: Record<RangeType, string> = {
  "7d": "the previous 7 days",
  "30d": "the previous 30 days",
  "12m": "the previous 12 months",
};

export type Granularity = "date" | "yearMonth";
export type DateRange = { start: string; end: string };

export type RangeWindow = {
  type: RangeType;
  timeZone: string;
  /** Today in the site's time zone. Only the live globe shows today. */
  today: string;
  current: DateRange;
  previous: DateRange;
  granularity: Granularity;
  /** The current period includes yesterday, which GA4 may still be adding to. */
  includesYesterday: boolean;
};

/** Reads `?range=` safely. Anything unknown becomes the default. */
export function parseRange(value: unknown): RangeType {
  const v = Array.isArray(value) ? value[0] : value;
  return RANGE_TYPES.includes(v as RangeType) ? (v as RangeType) : DEFAULT_RANGE;
}

/** Today's calendar date in a time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function toUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function fromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = toUtc(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** First day of the month `months` away from the month of `isoDate`. */
export function addMonths(isoDate: string, months: number): string {
  const d = toUtc(isoDate);
  return fromUtc(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1)));
}

/** Last day of the month of `isoDate`. */
export function endOfMonth(isoDate: string): string {
  const d = toUtc(isoDate);
  return fromUtc(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

/** Number of days in a range, both ends included. */
export function daysIn(range: DateRange): number {
  return Math.round((toUtc(range.end).getTime() - toUtc(range.start).getTime()) / 86_400_000) + 1;
}

export function rangeWindow(
  type: RangeType,
  timeZone: string,
  now: Date = new Date(),
): RangeWindow {
  const today = todayIn(timeZone, now);
  const yesterday = addDays(today, -1);

  if (type === "12m") {
    const start = addMonths(today, -12);
    const end = addDays(addMonths(today, 0), -1); // last day of last month
    const previousStart = addMonths(today, -24);
    return {
      type,
      timeZone,
      today,
      current: { start, end },
      previous: { start: previousStart, end: addDays(start, -1) },
      granularity: "yearMonth",
      includesYesterday: end === yesterday,
    };
  }

  const days = type === "7d" ? 7 : 30;
  const start = addDays(yesterday, -(days - 1));
  return {
    type,
    timeZone,
    today,
    current: { start, end: yesterday },
    previous: { start: addDays(start, -days), end: addDays(start, -1) },
    granularity: "date",
    includesYesterday: true,
  };
}

/**
 * The series keys GA4 uses for each chart point in the current period, in order:
 * "YYYYMMDD" (daily) or "YYYYMM" (monthly).
 */
export function seriesKeys(window: Pick<RangeWindow, "current" | "granularity">): string[] {
  const keys: string[] = [];
  const { start, end } = window.current;
  if (window.granularity === "yearMonth") {
    for (let m = start; m <= end; m = addMonths(m, 1)) keys.push(m.slice(0, 7).replace("-", ""));
    return keys;
  }
  for (let d = start; d <= end; d = addDays(d, 1)) keys.push(d.replaceAll("-", ""));
  return keys;
}

/** "20261004" / "202610" → the ISO date of its day or month. */
export function keyToDate(key: string): string {
  const y = key.slice(0, 4);
  const m = key.slice(4, 6);
  const d = key.length >= 8 ? key.slice(6, 8) : "01";
  return `${y}-${m}-${d}`;
}

/** The previous period started before the property existed, so there is no honest comparison. */
export function lacksHistory(
  window: RangeWindow,
  propertyCreatedAt: Date | null | undefined,
): boolean {
  if (!propertyCreatedAt) return false;
  return window.previous.start < todayIn(window.timeZone, propertyCreatedAt);
}
