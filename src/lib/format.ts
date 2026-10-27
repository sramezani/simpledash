/**
 * The one home for formatting numbers, durations, % change, dates and prices
 * (docs/SPEC.md section 4). Everything on screen and in emails goes through here.
 */

import { currency as planCurrency } from "@/config/plans";

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

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function weekday(isoDate: string): string {
  const { y, m, d } = parts(isoDate);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
}

/** "2026-10-23" → "Friday 23 October": a day in a sentence. */
export function formatLongDay(isoDate: string): string {
  const { m, d } = parts(isoDate);
  return `${weekday(isoDate)} ${d} ${LONG_MONTHS[m - 1]}`;
}

/** "2026-10-23" → "Fri 23": a day in a tight label. */
export function formatShortDay(isoDate: string): string {
  return `${weekday(isoDate).slice(0, 3)} ${parts(isoDate).d}`;
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

/** Our prices, in whole dollars: 9 → "$9", 90 → "$90" (src/config/plans.ts). */
export function formatPrice(amount: number, currency: string = planCurrency): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
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

/** A click rate, 0–1: 0.0213 → "2.1%", 0.153 → "15%", 0.0004 → "0.04%". */
export function formatRate(rate: number): string {
  const pct = Math.max(0, rate) * 100;
  if (pct === 0) return "0%";
  if (pct < 0.1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${integer.format(pct)}%`;
}

/** A Google search position, as Search Console shows it: 11.23 → "11.2", 1 → "1". */
export function formatPosition(position: number): string {
  const rounded = Math.round(position * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** How many decimals a currency has (EUR 2, JPY 0), from Intl. */
export function currencyDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat(LOCALE, { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * An amount in a currency's smallest unit (cents) for people: 123456 EUR → "€1,235",
 * 1990 EUR → "€19.90", 500 JPY → "¥500". Round amounts from 1,000 up drop the cents.
 */
export function formatMoney(minor: number, currency: string): string {
  const digits = currencyDigits(currency);
  const major = minor / 10 ** digits;
  const whole = Math.abs(major) >= 1000 || Number.isInteger(major);
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : digits,
      maximumFractionDigits: whole ? 0 : digits,
    }).format(major);
  } catch {
    return `${formatNumber(major)} ${currency}`;
  }
}

/** How long ago, for "Synced 12 minutes ago": just now, minutes, hours, then the date. */
export function formatAgo(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return `on ${formatDate(date)}`;
}
