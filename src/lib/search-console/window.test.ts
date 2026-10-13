import { describe, expect, it } from "vitest";
import { historyStart, latestProbe, newestDay, searchWindow } from "./window";

describe("searchWindow", () => {
  it("moves a period that reaches past Google's newest day back, keeping its length", () => {
    const w = searchWindow({ start: "2026-10-06", end: "2026-10-12" }, "2026-10-10");
    expect(w.current).toEqual({ start: "2026-10-04", end: "2026-10-10" });
    expect(w.previous).toEqual({ start: "2026-09-27", end: "2026-10-03" });
    expect(w).toMatchObject({ days: 7, shifted: true, clipped: false, comparable: true });
  });

  it("leaves a finished period alone", () => {
    const w = searchWindow({ start: "2026-09-01", end: "2026-09-30" }, "2026-10-10");
    expect(w.current).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(w.previous).toEqual({ start: "2026-08-02", end: "2026-08-31" });
    expect(w.shifted).toBe(false);
  });

  it("turns Today into Google's newest single day", () => {
    const w = searchWindow({ start: "2026-10-13", end: "2026-10-13" }, "2026-10-10");
    expect(w.current).toEqual({ start: "2026-10-10", end: "2026-10-10" });
    expect(w.previous).toEqual({ start: "2026-10-09", end: "2026-10-09" });
  });

  it("can't compare 12 months with the 12 before: Search Console keeps 16 months", () => {
    const w = searchWindow({ start: "2025-10-01", end: "2026-09-30" }, "2026-10-10");
    expect(w.clipped).toBe(false);
    expect(w.comparable).toBe(false);
  });

  it("starts a long custom period at the 16-month limit, and says so", () => {
    const w = searchWindow({ start: "2024-01-01", end: "2026-09-30" }, "2026-10-10");
    expect(w.current.start).toBe("2025-06-10");
    expect(w).toMatchObject({ clipped: true, comparable: false });
  });
});

describe("historyStart", () => {
  it("is 16 months back, never past a short month", () => {
    expect(historyStart("2026-10-10")).toBe("2025-06-10");
    expect(historyStart("2026-07-31")).toBe("2025-03-28");
  });
});

describe("newest day", () => {
  it("probes the last 10 days in California time", () => {
    // 05:00 UTC on 13 Oct is still 12 Oct in California.
    expect(latestProbe(new Date("2026-10-13T05:00:00Z"))).toEqual({
      start: "2026-10-02",
      end: "2026-10-12",
    });
  });

  it("is the newest date Google returned, or 3 days back without any", () => {
    expect(newestDay(["2026-10-08", "2026-10-10", "2026-10-09"])).toBe("2026-10-10");
    expect(newestDay([], new Date("2026-10-13T20:00:00Z"))).toBe("2026-10-10");
  });
});
