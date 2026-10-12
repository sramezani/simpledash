import { describe, expect, it } from "vitest";
import { smoothPath } from "./path";

/** Every number in a path, in order. */
const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("smoothPath", () => {
  it("starts at the first point and ends at the last", () => {
    const d = smoothPath([
      { x: 0, y: 50 },
      { x: 50, y: 20 },
      { x: 100, y: 80 },
    ]);
    expect(d.startsWith("M0,50C")).toBe(true);
    expect(d.endsWith(" 100,80")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });

  it("never overshoots: control points stay between their two points", () => {
    const points = [0, 90, 10, 100, 0, 100, 100, 0].map((y, i) => ({ x: i * 10, y }));
    const values = numbers(smoothPath(points));
    const ys = values.filter((_, i) => i % 2 === 1);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
  });

  it("stays flat on a flat line", () => {
    const d = smoothPath([
      { x: 0, y: 40 },
      { x: 10, y: 40 },
      { x: 20, y: 40 },
    ]);
    expect(numbers(d).filter((_, i) => i % 2 === 1)).toEqual(Array(7).fill(40));
  });

  it("draws one part of the line, joining the rest without a kink", () => {
    const points = [10, 30, 20, 60].map((y, i) => ({ x: i * 10, y }));
    const whole = smoothPath(points);
    const first = smoothPath(points, 0, 2);
    const last = smoothPath(points, 2, 3);
    expect(last.startsWith("M20,20C")).toBe(true);
    expect(whole).toBe(first + last.replace("M20,20", ""));
  });

  it("handles one point and no points", () => {
    expect(smoothPath([{ x: 50, y: 10 }])).toBe("M50,10");
    expect(smoothPath([])).toBe("");
  });
});
