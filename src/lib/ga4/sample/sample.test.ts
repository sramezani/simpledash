import { describe, expect, it } from "vitest";
import { rangeWindow } from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { sampleReports } from "./sample";

describe("sampleReports", () => {
  const now = new Date("2026-10-11T12:00:00Z");

  it("gives every report for every range", () => {
    for (const range of ["7d", "30d", "12m"] as const) {
      const reports = sampleReports(rangeWindow(range, "UTC", now), REPORTS);
      for (const name of REPORTS) expect(reports[name].data, `${range} ${name}`).toBeTruthy();
    }
  });

  it("is deterministic and plausible", () => {
    const w = rangeWindow("7d", "UTC", now);
    const a = sampleReports(w, ["totals", "series"]);
    const b = sampleReports(w, ["totals", "series"]);
    expect(a).toEqual(b);
    expect(a.totals.data.current.visitors).toBeGreaterThan(500);
    expect(a.series.data.points).toHaveLength(7);
  });

  it("has 12 monthly points with sensible values", () => {
    const points = sampleReports(rangeWindow("12m", "UTC", now), ["series"]).series.data.points;
    expect(points).toHaveLength(12);
    for (const p of points) expect(p.visitors).toBeGreaterThan(1000);
  });
});
