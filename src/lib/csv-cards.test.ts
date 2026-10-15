import { describe, expect, it } from "vitest";
import { csvCardIds } from "@/config/cards";
import { rangeWindow } from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { sampleReports } from "@/lib/ga4/sample/sample";
import { csvReports, csvTable } from "./csv-cards";

const window = rangeWindow("7d", "UTC", new Date("2026-10-11T12:00:00Z"));
const samples = sampleReports(window, REPORTS);
const data = Object.fromEntries(REPORTS.map((r) => [r, samples[r].data]));

describe("csvTable", () => {
  it("has a table for every card with a CSV", () => {
    for (const card of csvCardIds) {
      expect(csvReports[card], card).toBeTruthy();
      expect(csvTable(card, data, window, "sign_up"), card).not.toBeNull();
    }
  });

  it("writes both periods for a number", () => {
    const t = csvTable("visitors", data, window, null)!;
    expect(t.header).toEqual(["Period", "Start", "End", "Visitors"]);
    expect(t.rows[0]!.slice(0, 3)).toEqual(["This period", "2026-10-05", "2026-10-11"]);
    expect(t.rows[1]!.slice(0, 3)).toEqual(["Previous period", "2026-09-28", "2026-10-04"]);
  });

  it("writes the chart as dates", () => {
    const t = csvTable("chart", data, window, null)!;
    expect(t.rows[0]).toEqual(["2026-10-05", expect.any(Number)]);
  });

  it("has nothing for Signups without an event", () => {
    expect(csvTable("signups", data, window, null)).toBeNull();
  });

  it("has nothing when the report is missing", () => {
    expect(csvTable("pages", {}, window, null)).toBeNull();
  });
});
