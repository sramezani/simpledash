import { describe, expect, it } from "vitest";
import { rangeWindow, seriesKeys } from "@/lib/ga4/ranges";
import {
  chartCaption,
  chartPoints,
  withRevenue,
  niceTicks,
  noteKey,
  noteMarks,
  pendingCount,
  periodLabel,
  pointLabel,
} from "./series";

const now = new Date("2026-10-11T12:00:00Z");
const series = (range: "7d" | "30d" | "12m") => {
  const w = rangeWindow(range, "UTC", now);
  return { w, points: seriesKeys(w).map((key, i) => ({ key, visitors: i + 1 })) };
};

describe("pointLabel", () => {
  it("labels hours, days and months in plain words", () => {
    expect(pointLabel("2026100409", "dateHour")).toBe("09:00");
    expect(pointLabel("20261004", "date")).toBe("Sun 4 Oct");
    expect(pointLabel("202610", "yearMonth")).toBe("Oct 2026");
  });
});

describe("hourly charts", () => {
  it("ticks every 4 hours and dashes today's latest hour", () => {
    const w = rangeWindow("today", "UTC", new Date("2026-10-11T14:30:00Z"));
    const points = seriesKeys(w).map((key) => ({ key, visitors: 1 }));
    const out = chartPoints(points, w.granularity, w.lastPointPending);
    expect(out.filter((p) => p.tick).map((p) => p.tick)).toEqual([
      "00:00",
      "04:00",
      "08:00",
      "12:00",
    ]);
    expect(out.at(-1)?.solid).toBeNull();
    expect(out.at(-1)?.pending).toBe(1);
  });

  it("draws yesterday's hours solid", () => {
    const w = rangeWindow("yesterday", "UTC", now);
    const points = seriesKeys(w).map((key) => ({ key, visitors: 1 }));
    expect(chartPoints(points, w.granularity, w.lastPointPending).every((p) => p.solid === 1)).toBe(
      true,
    );
  });

  it("puts a day's note at midnight on an hourly chart", () => {
    expect(noteKey("2026-10-10", "dateHour")).toBe("2026101000");
  });
});

describe("periodLabel", () => {
  it("names one day, a run of days or a run of months", () => {
    expect(periodLabel(rangeWindow("yesterday", "UTC", now))).toBe("Sat 10 Oct");
    expect(periodLabel(rangeWindow("7d", "UTC", now))).toBe("4 Oct – 10 Oct");
    expect(periodLabel(rangeWindow("12m", "UTC", now))).toBe("Oct 2025 – Sep 2026");
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

describe("withRevenue", () => {
  const points = chartPoints(
    [
      { key: "20261005", visitors: 10 },
      { key: "20261006", visitors: 12 },
    ],
    "date",
    false,
  );
  const byDay = new Map([
    ["2026-10-05", 1900],
    ["2026-10-07", 900],
  ]);

  it("puts each day's revenue on its point, 0 on days without", () => {
    expect(withRevenue(points, "date", byDay).map((p) => p.revenue)).toEqual([1900, 0]);
  });

  it("adds a month's days together, and leaves hourly charts alone", () => {
    const months = chartPoints([{ key: "202610", visitors: 100 }], "yearMonth", false);
    expect(withRevenue(months, "yearMonth", byDay)[0]!.revenue).toBe(2800);
    expect(withRevenue(points, "dateHour", byDay)[0]!.revenue).toBeUndefined();
  });
});
