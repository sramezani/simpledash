import { formatDay, formatMonth, formatNumber } from "@/lib/format";
import { keyToDate, type Granularity } from "@/lib/ga4/ranges";

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
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekday(isoDate: string) {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]!;
}

export function pointLabel(key: string, granularity: Granularity): string {
  const date = keyToDate(key);
  return granularity === "yearMonth" ? formatMonth(date) : `${weekday(date)} ${formatDay(date)}`;
}

function tickLabel(key: string, granularity: Granularity, index: number, count: number): string {
  const date = keyToDate(key);
  if (granularity === "yearMonth") return formatMonth(date).slice(0, 3);
  // Daily: every day for a week, otherwise about 6 ticks, always including the last day.
  if (count <= 8) return `${weekday(date)} ${Number(date.slice(8, 10))}`;
  const step = Math.ceil(count / 6);
  return (count - 1 - index) % step === 0 ? formatDay(date) : "";
}

/** How many points at the end are still updating: yesterday, or the month that ended yesterday. */
export function pendingCount(includesYesterday: boolean): number {
  return includesYesterday ? 1 : 0;
}

export function chartPoints(
  points: { key: string; visitors: number }[],
  granularity: Granularity,
  includesYesterday: boolean,
): ChartPoint[] {
  const pending = Math.min(pendingCount(includesYesterday), points.length);
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

const PER: Record<Granularity, string> = { date: "day", yearMonth: "month" };

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

/** The chart key a note sits on: its day, or its month on the 12-month chart. */
export function noteKey(day: string, granularity: Granularity): string {
  const compact = day.replaceAll("-", "");
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
