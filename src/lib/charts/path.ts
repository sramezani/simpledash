/**
 * A smooth line through chart points, as an SVG path: monotone cubic curves
 * (Fritsch–Carlson, like d3's curveMonotoneX). The curve never overshoots a point,
 * so it never dips below zero or above the highest day. Pure, so it is tested.
 */

export type XY = { x: number; y: number };

/** The slope of the curve at each point. */
function tangents(points: XY[]): number[] {
  const n = points.length;
  if (n < 2) return points.map(() => 0);
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    slope.push(b.x === a.x ? 0 : (b.y - a.y) / (b.x - a.x));
  }
  const t: number[] = points.map((_, i) => {
    if (i === 0) return slope[0]!;
    if (i === n - 1) return slope[n - 2]!;
    const before = slope[i - 1]!;
    const after = slope[i]!;
    return before * after <= 0 ? 0 : (before + after) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    const s = slope[i]!;
    if (s === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i]! / s;
    const b = t[i + 1]! / s;
    const h = a * a + b * b;
    if (h > 9) {
      const tau = 3 / Math.sqrt(h);
      t[i] = tau * a * s;
      t[i + 1] = tau * b * s;
    }
  }
  return t;
}

const fmt = (v: number) => Number(v.toFixed(2)).toString();

/**
 * The path from point `from` to point `to` (both included) of the smooth curve
 * through all `points`. Slopes come from the whole line, so two parts drawn
 * separately (solid and dashed) meet without a kink.
 */
export function smoothPath(points: XY[], from = 0, to = points.length - 1): string {
  if (points.length === 0 || to < from) return "";
  const t = tangents(points);
  const start = points[from]!;
  let d = `M${fmt(start.x)},${fmt(start.y)}`;
  for (let i = from; i < to; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const h = (b.x - a.x) / 3;
    d += `C${fmt(a.x + h)},${fmt(a.y + t[i]! * h)} ${fmt(b.x - h)},${fmt(b.y - t[i + 1]! * h)} ${fmt(b.x)},${fmt(b.y)}`;
  }
  return d;
}
