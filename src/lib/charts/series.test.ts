import { describe, expect, it } from "vitest";
import { rangeWindow, seriesKeys } from "@/lib/ga4/ranges";
import {
  chartCaption,
  chartPoints,
  niceTicks,
  noteKey,
  noteMarks,
  pendingCount,
  pointLabel,
} from "./series";

const now = new Date("2026-10-11T12:00:00Z");
const series = (range: "7d" | "30d" | "12m") => {
  const w = rangeWindow(range, "UTC", now);
  return { w, points: seriesKeys(w).map((key, i) => ({ key, visitors: i + 1 })) };
};

describe("pointLabel", () => {
  it("labels days and months in plain words", () => {
    expect(pointLabel("20261004", "date")).toBe("Sun 4 Oct");
    expect(pointLabel("202610", "yearMonth")).toBe("Oct 2026");
  });
});

describe("chartPoints", () => {
  it("dashes yesterday, joined to the solid line", () => {
    const { w, points } = series("7d");
    const out = chartPoints(points, w.granularity, w.includesYesterday);
    expect(out).toHaveLength(7);
    expect(out.filter((p) => p.solid !== null)).toHaveLength(6);
    expect(out.filter((p) => p.pending !== null)).toHaveLength(2);
    expect(out[5]!.solid).not.toBeNull();
    expect(out[5]!.pending).not.toBeNull();
  });

  it("labels every day of a week", () => {
    const { w, points } = series("7d");
    const ticks = chartPoints(points, w.granularity, true).filter((p) => p.tick);
    expect(ticks.map((t) => t.tick)).toEqual([
      "Sun 4",
      "Mon 5",
      "Tue 6",
      "Wed 7",
      "Thu 8",
      "Fri 9",
      "Sat 10",
    ]);
  });

  it("dashes only the last day on the daily chart, with about 6 ticks ending on it", () => {
    const { w, points } = series("30d");
    const out = chartPoints(points, w.granularity, true);
    expect(out.filter((p) => p.pending !== null)).toHaveLength(2);
    const ticks = out.filter((p) => p.tick);
    expect(ticks.length).toBeGreaterThanOrEqual(5);
    expect(ticks.length).toBeLessThanOrEqual(7);
    expect(ticks.at(-1)!.key).toBe(out.at(-1)!.key);
  });

  it("has no dashed part when the range doesn't include yesterday", () => {
    const { w, points } = series("12m");
    const out = chartPoints(points, w.granularity, w.includesYesterday);
    expect(out.every((p) => p.pending === null)).toBe(true);
    expect(out.map((p) => p.tick)).toContain("Oct");
    expect(pendingCount(false)).toBe(0);
  });
});

describe("chartCaption", () => {
  it("describes the chart for screen readers", () => {
    const { w, points } = series("30d");
    const out = chartPoints(points, w.granularity, true);
    expect(chartCaption(out, "date", "11 Sep – 10 Oct")).toBe(
      "Visitors per day, 11 Sep – 10 Oct. Highest: 30 on Sat 10 Oct.",
    );
  });

  it("says so when there were no visitors", () => {
    const out = chartPoints([{ key: "20261004", visitors: 0 }], "date", false);
    expect(chartCaption(out, "date", "4 Oct")).toBe("Visitors per day, 4 Oct. No visitors.");
  });
});

describe("notes on the chart", () => {
  it("sits on its day, or its month on the 12-month chart", () => {
    expect(noteKey("2026-10-07", "date")).toBe("20261007");
    expect(noteKey("2026-10-07", "yearMonth")).toBe("202610");
  });

  it("keeps notes inside the range and joins notes on one point", () => {
    const { w, points } = series("7d");
    const out = chartPoints(points, w.granularity, true);
    const marks = noteMarks(
      [
        { id: "a", day: "2026-10-06", text: "Launched" },
        { id: "b", day: "2026-10-06", text: "Tweet" },
        { id: "c", day: "2026-09-01", text: "Too early" },
      ],
      out,
      w.granularity,
    );
    expect(marks).toEqual([{ id: "a", key: "20261006", text: "Launched · Tweet" }]);
  });
});

describe("niceTicks", () => {
  it("makes round steps up to at least the highest value", () => {
    expect(niceTicks(312)).toEqual([0, 100, 200, 300, 400]);
    expect(niceTicks(4)).toEqual([0, 1, 2, 3, 4]);
    expect(niceTicks(9)).toEqual([0, 5, 10]);
    expect(niceTicks(0.4)).toEqual([0, 1]);
    expect(niceTicks(1726)).toEqual([0, 500, 1000, 1500, 2000]);
  });

  it("handles an empty chart", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
