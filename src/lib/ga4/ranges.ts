import { formatDay, formatDayRange } from "@/lib/format";

/**
 * Date ranges and comparisons (docs/SPEC.md section 8). All dates are calendar
 * dates (YYYY-MM-DD) in the site's GA4 time zone, worked out with Intl and
 * plain date arithmetic. Preset ranges are full days ending yesterday, except
 * "Today", which is today so far. A custom range is any run of days up to today.
 */

export const RANGE_PRESETS = ["today", "yesterday", "7d", "30d", "12m"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
/** A custom range of whole days, both included: "2026-09-01..2026-09-30". */
export type CustomRange = `${string}..${string}`;
export type RangeType = RangePreset | CustomRange;
export const DEFAULT_RANGE: RangePreset = "7d";

const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "12m": "Last 12 months",
};

const PRESET_PREVIOUS: Record<RangePreset, string> = {
  today: "yesterday",
  yesterday: "the day before",
  "7d": "the previous 7 days",
  "30d": "the previous 30 days",
  "12m": "the previous 12 months",
};

/** GA4 has no data before this day, so a custom range can't start earlier. */
export const GA4_FIRST_DAY = "2015-08-14";
/** Custom ranges are at most about 5 years, so the period before stays a sane request. */
export const MAX_CUSTOM_DAYS = 5 * 366;
/** Custom ranges up to this many days are drawn per day; longer ones per month. */
const MAX_DAILY_POINTS = 92;

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
  /** The current period ends today, which isn't over: no comparison, short cache. */
  endsToday: boolean;
  /** The chart's last point is still filling up: drawn dashed. */
  lastPointPending: boolean;
  /** Hourly charts: the last hour shown (the current hour for today). */
  lastHour: number | null;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const CUSTOM = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/;

/** A real calendar day as YYYY-MM-DD ("2026-02-30" is not). */
export function isIsoDay(value: string): boolean {
  return ISO_DAY.test(value) && fromUtc(toUtc(value)) === value;
}

/** The custom range for two days, in order, from GA4's first day: "2026-09-01..2026-09-30". */
export function customRange(a: string, b: string): CustomRange {
  let [start, end] = a <= b ? [a, b] : [b, a];
  if (start < GA4_FIRST_DAY) start = GA4_FIRST_DAY;
  if (end < start) end = start;
  return `${start}..${end}`;
}

/** The two days of a custom range, or null for a preset. */
export function customDays(range: RangeType): DateRange | null {
  const match = CUSTOM.exec(range);
  return match ? { start: match[1]!, end: match[2]! } : null;
}

export function isPreset(range: RangeType): range is RangePreset {
  return (RANGE_PRESETS as readonly string[]).includes(range);
}

/** Reads `?range=` safely: a preset or a valid custom range. Anything else becomes the default. */
export function parseRange(value: unknown, fallback: RangeType = DEFAULT_RANGE): RangeType {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string") return fallback;
  if (isPreset(v as RangeType)) return v as RangePreset;
  const match = CUSTOM.exec(v);
  if (!match || !isIsoDay(match[1]!) || !isIsoDay(match[2]!)) return fallback;
  return customRange(match[1]!, match[2]!);
}

/** "Last 7 days", or a custom range's days: "1 Sep – 30 Sep", "Mon 12 Oct". */
export function rangeLabel(range: RangeType): string {
  if (isPreset(range)) return PRESET_LABELS[range];
  const days = customDays(range)!;
  return days.start === days.end ? dayName(days.start) : formatDayRange(days.start, days.end);
}

/** "the previous 7 days", "the day before", "the 30 days before": for the summary and screen readers. */
export function previousPeriodWords(range: RangeType): string {
  if (isPreset(range)) return PRESET_PREVIOUS[range];
  const days = daysIn(customDays(range)!);
  return days === 1 ? "the day before" : `the ${days} days before`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Mon 12 Oct". */
export function dayName(isoDate: string): string {
  return `${WEEKDAYS[toUtc(isoDate).getUTCDay()]} ${formatDay(isoDate)}`;
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

  const custom = customDays(type);
  if (custom) {
    // Never past today in the site's time zone, and at most MAX_CUSTOM_DAYS long.
    const end = custom.end > today ? today : custom.end;
    let start = custom.start > end ? end : custom.start;
    if (daysIn({ start, end }) > MAX_CUSTOM_DAYS) start = addDays(end, -(MAX_CUSTOM_DAYS - 1));
    const days = daysIn({ start, end });
    const granularity: Granularity =
      days === 1 ? "dateHour" : days <= MAX_DAILY_POINTS ? "date" : "yearMonth";
    const endsToday = end === today;
    return {
      ...base,
      current: { start, end },
      previous: { start: addDays(start, -days), end: addDays(start, -1) },
      granularity,
      includesYesterday: start <= yesterday && end >= yesterday,
      endsToday,
      // A single past day is drawn solid, like Yesterday; otherwise the newest point is
      // dashed while Google may still be adding to it.
      lastPointPending: granularity === "dateHour" ? endsToday : end >= yesterday,
      lastHour: granularity === "dateHour" ? (endsToday ? hourIn(timeZone, now) : 23) : null,
    };
  }

  if (type === "today" || type === "yesterday") {
    const day = type === "today" ? today : yesterday;
    const before = addDays(day, -1);
    return {
      ...base,
      current: { start: day, end: day },
      previous: { start: before, end: before },
      granularity: "dateHour",
      includesYesterday: type === "yesterday",
      endsToday: type === "today",
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
      endsToday: false,
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
    endsToday: false,
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
 * Today isn't over, so a period that ends today would always read "down".
 */
export function comparisonGap(
  window: RangeWindow,
  propertyCreatedAt: Date | null | undefined,
): string | null {
  if (window.endsToday) return "Today isn't over yet";
  if (lacksHistory(window, propertyCreatedAt)) return "Not enough history to compare";
  return null;
}

/** The menu key for each preset (DataFast-style), shown next to it and active while the menu is open. */
const SHORTCUTS: Record<RangePreset, string> = {
  today: "T",
  yesterday: "Y",
  "7d": "W",
  "30d": "M",
  "12m": "L",
};

/** Stands for the chosen days in the custom range's address; the date menu swaps it for "start..end". */
const CUSTOM_SLOT = "CUSTOM_RANGE";

export type RangeMenu = {
  /** The range shown now, and its label: "Last 7 days", "1 Sep – 30 Sep". */
  value: RangeType;
  label: string;
  presets: {
    value: RangePreset;
    label: string;
    href: string;
    shortcut: string;
    /** A line above it, between the single days and the longer periods. */
    separated: boolean;
  }[];
  custom: {
    /** The page address with `slot` where "start..end" goes. */
    href: string;
    slot: string;
    /** The days the calendar starts with: the period shown now. */
    start: string;
    end: string;
    /** The first and last days that can be picked (today in the site's time zone). */
    firstDay: string;
    lastDay: string;
  };
};

/**
 * The date menu (docs/SPEC.md section 8): the presets, each linking to
 * `basePath?range=…` (the page's default range has no `?range=`), and what the
 * custom range calendar needs. `query` keeps other search params (dev previews,
 * the embedded demo).
 */
export function rangeMenu(
  range: RangeType,
  window: Pick<RangeWindow, "current" | "today">,
  basePath: string,
  query: Record<string, string> = {},
  defaultRange: RangeType = DEFAULT_RANGE,
): RangeMenu {
  const href = (r: string) => {
    const params = new URLSearchParams(query);
    if (r !== defaultRange) params.set("range", r);
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };
  return {
    value: range,
    label: rangeLabel(range),
    presets: RANGE_PRESETS.map((r) => ({
      value: r,
      label: PRESET_LABELS[r],
      href: href(r),
      shortcut: SHORTCUTS[r],
      separated: r === "7d",
    })),
    custom: {
      href: href(CUSTOM_SLOT),
      slot: CUSTOM_SLOT,
      start: window.current.start,
      end: window.current.end,
      firstDay: GA4_FIRST_DAY,
      lastDay: window.today,
    },
  };
}

/** What to say about the newest numbers, next to the period. */
export function freshnessNote(
  window: Pick<RangeWindow, "type" | "includesYesterday" | "endsToday">,
): string | null {
  if (window.type === "today") return "So far today. Google adds visits a few hours late.";
  if (window.endsToday) return "Includes today so far. Google adds visits a few hours late.";
  if (window.includesYesterday) return "Google may still be adding to yesterday.";
  return null;
}
