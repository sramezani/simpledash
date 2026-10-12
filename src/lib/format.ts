/**
 * The one home for formatting numbers, durations, % change, dates and prices
 * (docs/SPEC.md section 4). Everything on screen and in emails goes through here.
 */

const LOCALE = "en-GB";

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 1234 → "1,234". */
export function formatNumber(value: number): string {
  return integer.format(Math.round(value));
}

/** 1234 → "1,234", 123456 → "123K". For tight spaces such as chart axes. */
export function formatCompact(value: number): string {
  return Math.abs(value) < 10_000 ? formatNumber(value) : compact.format(value);
}

/** Seconds → "1m 23s", "45s", "1h 5m". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

/**
 * % change, rounded to a whole number (docs/SPEC.md section 8).
 * Returns null when there is nothing honest to compare with: no previous value or a zero.
 */
export function percentChange(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  return Object.is(change, -0) ? 0 : change;
}

/** 23 → "23%", -12 → "12%" (the arrow and word carry the direction). */
export function formatPercent(value: number): string {
  return `${integer.format(Math.abs(value))}%`;
}

/** Share of a total, e.g. 0.256 → "26%". */
export function formatShare(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${integer.format((part / total) * 100)}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

/** "2026-10-04" → "4 Oct". Add the year with `withYear`. */
export function formatDay(isoDate: string, withYear = false): string {
  const { y, m, d } = parts(isoDate);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "2026-10" or "2026-10-01" → "Oct 2026". */
export function formatMonth(isoMonth: string): string {
  const { y, m } = parts(isoMonth.length === 7 ? `${isoMonth}-01` : isoMonth);
  return `${MONTHS[m - 1]} ${y}`;
}

/** A range of days: "4 Oct – 10 Oct", or with years when they differ. */
export function formatDayRange(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatDay(start, !sameYear)} – ${formatDay(end, !sameYear)}`;
}

/** Whole euros: 9 → "€9", 90 → "€90". */
export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** A date for people: 11 Oct 2027. */
export function formatDate(date: Date, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** A clock time in a time zone: "14:00". */
export function formatTime(date: Date, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}
