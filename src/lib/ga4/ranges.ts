/**
 * Date ranges and comparisons (docs/SPEC.md section 8). All dates are calendar
 * dates (YYYY-MM-DD) in the site's GA4 time zone, worked out with Intl and
 * plain date arithmetic. Ranges are full days ending yesterday, except "Today",
 * which is today so far.
 */

export const RANGE_TYPES = ["today", "yesterday", "7d", "30d", "12m"] as const;
export type RangeType = (typeof RANGE_TYPES)[number];
export const DEFAULT_RANGE: RangeType = "7d";

export const RANGE_LABELS: Record<RangeType, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "12m": "Last 12 months",
};

/** "the previous 7 days", used by the summary line and screen readers. */
export const PREVIOUS_PERIOD_WORDS: Record<RangeType, string> = {
  today: "yesterday",
  yesterday: "the day before",
  "7d": "the previous 7 days",
  "30d": "the previous 30 days",
  "12m": "the previous 12 months",
};

export type Granularity = "dateHour" | "date" | "yearMonth";
export type DateRange = { start: string; end: string };

export type RangeWindow = {
  type: RangeType;
  timeZone: string;
  /** Today in the site's time zone. */
  today: string;
  current: DateRange;
  previous: DateRange;
  granularity: Granularity;
  /** The current period includes yesterday, which GA4 may still be adding to. */
  includesYesterday: boolean;
  /** The chart's last point is still filling up: drawn dashed. */
  lastPointPending: boolean;
  /** Hourly charts: the last hour shown (the current hour for "Today"). */
  lastHour: number | null;
};

/** Reads `?range=` safely. Anything unknown becomes the default. */
export function parseRange(value: unknown, fallback: RangeType = DEFAULT_RANGE): RangeType {
  const v = Array.isArray(value) ? value[0] : value;
  return RANGE_TYPES.includes(v as RangeType) ? (v as RangeType) : fallback;
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

/** The current hour (0–23) in a time zone. */
export function hourIn(timeZone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(hour) % 24;
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
  const base = { type, timeZone, today };

  if (type === "today" || type === "yesterday") {
    const day = type === "today" ? today : yesterday;
    const before = addDays(day, -1);
    return {
      ...base,
      current: { start: day, end: day },
      previous: { start: before, end: before },
      granularity: "dateHour",
      includesYesterday: type === "yesterday",
      // Today's latest hour is still filling up. Yesterday's hours are all shown solid,
      // with "still updating" said once above the cards.
      lastPointPending: type === "today",
      lastHour: type === "today" ? hourIn(timeZone, now) : 23,
    };
  }

  if (type === "12m") {
    const start = addMonths(today, -12);
    const end = addDays(addMonths(today, 0), -1); // last day of last month
    const previousStart = addMonths(today, -24);
    return {
      ...base,
      current: { start, end },
      previous: { start: previousStart, end: addDays(start, -1) },
      granularity: "yearMonth",
      includesYesterday: end === yesterday,
      lastPointPending: end === yesterday,
      lastHour: null,
    };
  }

  const days = type === "7d" ? 7 : 30;
  const start = addDays(yesterday, -(days - 1));
  return {
    ...base,
    current: { start, end: yesterday },
    previous: { start: addDays(start, -days), end: addDays(start, -1) },
    granularity: "date",
    includesYesterday: true,
    lastPointPending: true,
    lastHour: null,
  };
}

/**
 * The series keys GA4 uses for each chart point in the current period, in order:
 * "YYYYMMDDHH" (hourly), "YYYYMMDD" (daily) or "YYYYMM" (monthly).
 */
export function seriesKeys(
  window: Pick<RangeWindow, "current" | "granularity"> & { lastHour?: number | null },
): string[] {
  const keys: string[] = [];
  const { start, end } = window.current;
  if (window.granularity === "dateHour") {
    const day = start.replaceAll("-", "");
    const last = window.lastHour ?? 23;
    for (let h = 0; h <= last; h++) keys.push(`${day}${String(h).padStart(2, "0")}`);
    return keys;
  }
  if (window.granularity === "yearMonth") {
    for (let m = start; m <= end; m = addMonths(m, 1)) keys.push(m.slice(0, 7).replace("-", ""));
    return keys;
  }
  for (let d = start; d <= end; d = addDays(d, 1)) keys.push(d.replaceAll("-", ""));
  return keys;
}

/** "2026100414" → 14, the hour of an hourly key. */
export function keyToHour(key: string): number {
  return Number(key.slice(8, 10));
}

/** "2026100414" / "20261004" / "202610" → the ISO date of its hour, day or month. */
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

/**
 * Why the numbers can't be compared with the period before, or null when they can.
 * Today isn't over, so comparing it with all of yesterday would always read "down".
 */
export function comparisonGap(
  window: RangeWindow,
  propertyCreatedAt: Date | null | undefined,
): string | null {
  if (window.type === "today") return "Today isn't over yet";
  if (lacksHistory(window, propertyCreatedAt)) return "Not enough history to compare";
  return null;
}

/**
 * The date menu's options, linking to `basePath?range=…`. The page's default range
 * has no `?range=`; `query` keeps other search params (dev previews, the embedded demo).
 */
export function rangeMenu(
  basePath: string,
  query: Record<string, string> = {},
  defaultRange: RangeType = DEFAULT_RANGE,
): { value: RangeType; label: string; href: string; separated: boolean }[] {
  return RANGE_TYPES.map((r) => {
    const params = new URLSearchParams(query);
    if (r !== defaultRange) params.set("range", r);
    const search = params.toString();
    return {
      value: r,
      label: RANGE_LABELS[r],
      href: search ? `${basePath}?${search}` : basePath,
      // A line between the single days and the longer periods.
      separated: r === "7d",
    };
  });
}

/** What to say about the newest numbers, next to the period. */
export function freshnessNote(
  window: Pick<RangeWindow, "type" | "includesYesterday">,
): string | null {
  if (window.type === "today") return "So far today. Google adds visits a few hours late.";
  if (window.includesYesterday) return "Google may still be adding to yesterday.";
  return null;
}
