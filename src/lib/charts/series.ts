import { formatDay, formatDayRange, formatMonth, formatNumber } from "@/lib/format";
import { keyToDate, keyToHour, type Granularity, type RangeWindow } from "@/lib/ga4/ranges";

/**
 * Chart points from the `series` report, shared by the dashboard chart (Recharts)
 * and the server-rendered SVG chart. Pure, so it is tested.
 */

export type ChartPoint = {
  key: string;
  /** Tooltip and table label: "Sun 4 Oct" or "Oct 2026". */
  label: string;
  /** Axis label, or "" when this point gets no tick. */
  tick: string;
  visitors: number;
  /** The settled part of the line. */
  solid: number | null;
  /** The last part, still updating: drawn dashed. Overlaps `solid` by one point. */
  pending: number | null;
  /** Revenue from Stripe for this day or month, in the currency's smallest unit (Pro). */
  revenue?: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekday(isoDate: string) {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]!;
}

/** "14:00", the start of an hourly point. */
const hourLabel = (key: string) => `${String(keyToHour(key)).padStart(2, "0")}:00`;

export function pointLabel(key: string, granularity: Granularity): string {
  if (granularity === "dateHour") return hourLabel(key);
  const date = keyToDate(key);
  return granularity === "yearMonth" ? formatMonth(date) : `${weekday(date)} ${formatDay(date)}`;
}

function tickLabel(key: string, granularity: Granularity, index: number, count: number): string {
  // Hourly: every 4 hours from midnight.
  if (granularity === "dateHour") return keyToHour(key) % 4 === 0 ? hourLabel(key) : "";
  const date = keyToDate(key);
  if (granularity === "yearMonth") return formatMonth(date).slice(0, 3);
  // Daily: every day for a week, otherwise about 6 ticks, always including the last day.
  if (count <= 8) return `${weekday(date)} ${Number(date.slice(8, 10))}`;
  const step = Math.ceil(count / 6);
  return (count - 1 - index) % step === 0 ? formatDay(date) : "";
}

/** How many points at the end are still updating: yesterday, the month that ended yesterday, or this hour. */
export function pendingCount(lastPointPending: boolean): number {
  return lastPointPending ? 1 : 0;
}

export function chartPoints(
  points: { key: string; visitors: number }[],
  granularity: Granularity,
  lastPointPending: boolean,
): ChartPoint[] {
  const pending = Math.min(pendingCount(lastPointPending), points.length);
  const firstPending = points.length - pending;
  return points.map((p, i) => ({
    key: p.key,
    label: pointLabel(p.key, granularity),
    tick: tickLabel(p.key, granularity, i, points.length),
    visitors: p.visitors,
    solid: pending > 0 && i >= firstPending ? null : p.visitors,
    // Starts one point early so the dashed part joins the solid line.
    pending: pending > 0 && i >= firstPending - 1 ? p.visitors : null,
  }));
}

/**
 * Adds each day's (or month's) revenue to the chart's points (docs/SPEC.md section
 * 28.3). Stripe totals are daily, so hourly charts get none. Days without revenue are 0.
 */
export function withRevenue(
  points: ChartPoint[],
  granularity: Granularity,
  byDay: Map<string, number>,
): ChartPoint[] {
  if (granularity === "dateHour") return points;
  const sums = new Map<string, number>();
  for (const [day, amount] of byDay) {
    const key = granularity === "yearMonth" ? day.slice(0, 7).replace("-", "") : day.replaceAll("-", "");
    sums.set(key, (sums.get(key) ?? 0) + amount);
  }
  return points.map((p) => ({ ...p, revenue: sums.get(p.key) ?? 0 }));
}

const PER: Record<Granularity, string> = { dateHour: "hour", date: "day", yearMonth: "month" };

/** The period in words: "Mon 12 Oct", "4 Oct – 10 Oct" or "Oct 2025 – Sep 2026". */
export function periodLabel(window: Pick<RangeWindow, "current" | "granularity">): string {
  const { start, end } = window.current;
  if (window.granularity === "yearMonth") return `${formatMonth(start)} – ${formatMonth(end)}`;
  if (start === end) return `${weekday(start)} ${formatDay(start)}`;
  return formatDayRange(start, end);
}

/** The chart's text alternative: "Visitors per day, 4 Oct – 10 Oct. Highest: 312 on Wed 7 Oct." */
export function chartCaption(
  points: ChartPoint[],
  granularity: Granularity,
  period: string,
): string {
  const intro = `Visitors per ${PER[granularity]}, ${period}.`;
  if (points.length === 0) return `${intro} No data.`;
  const top = points.reduce((best, p) => (p.visitors > best.visitors ? p : best), points[0]!);
  if (top.visitors === 0) return `${intro} No visitors.`;
  return `${intro} Highest: ${formatNumber(top.visitors)} on ${top.label}.`;
}

/**
 * The chart key a note sits on: its day, its month on the 12-month chart, or
 * midnight on an hourly chart (notes are for a day, not an hour).
 */
export function noteKey(day: string, granularity: Granularity): string {
  const compact = day.replaceAll("-", "");
  if (granularity === "dateHour") return `${compact}00`;
  return granularity === "yearMonth" ? compact.slice(0, 6) : compact;
}

export type ChartNoteMark = { id: string; key: string; text: string };

/** Notes on chart points that exist in this range, with several notes on one point joined. */
export function noteMarks(
  notes: { id: string; day: string; text: string }[],
  points: ChartPoint[],
  granularity: Granularity,
): ChartNoteMark[] {
  const keys = new Set(points.map((p) => p.key));
  const byKey = new Map<string, ChartNoteMark>();
  for (const note of notes) {
    const key = noteKey(note.day, granularity);
    if (!keys.has(key)) continue;
    const existing = byKey.get(key);
    if (existing) existing.text = `${existing.text} · ${note.text}`;
    else byKey.set(key, { id: note.id, key, text: note.text });
  }
  return [...byKey.values()];
}

/** Round axis steps (1, 2 or 5 × 10ⁿ, whole numbers) from 0 to at least `max`, about `count` of them. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}
