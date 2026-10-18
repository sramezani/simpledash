import { describe, expect, it } from "vitest";
import { customerCounts, type CustomerData } from "./counts";

const data: CustomerData = {
  goalsSources: {
    rows: [
      { source: "google", label: "Google", events: { purchase: 9, sign_up: 40 } },
      { source: "reddit.com", label: "reddit.com", events: { purchase: 1 } },
    ],
  },
  pageSources: { rows: [{ source: "google", label: "Google", views: 2 }] },
  firstGoals: {
    rows: [
      { source: "google", label: "Google", events: { purchase: 4 } },
      { source: "reddit.com", label: "reddit.com", events: { purchase: 6 } },
    ],
  },
  firstPages: { rows: [{ source: "reddit.com", label: "reddit.com", views: 2 }] },
  goalPaths: {
    rows: [
      {
        first: "reddit.com",
        firstLabel: "reddit.com",
        last: "google",
        lastLabel: "Google",
        events: { purchase: 5 },
      },
    ],
    complete: true,
  },
  pagePaths: { rows: [], complete: false },
};

describe("customerCounts", () => {
  it("counts an event by first and last visit, with the paths between", () => {
    const counts = customerCounts(data, { event: "purchase", page: null });
    expect(counts.hasFirst).toBe(true);
    expect(counts.sources).toEqual([
      { source: "google", label: "Google", first: 4, last: 9 },
      { source: "reddit.com", label: "reddit.com", first: 6, last: 1 },
    ]);
    expect(counts.paths?.map((p) => [p.first, p.last, p.count])).toEqual([
      ["reddit.com", "google", 5],
    ]);
    expect(counts.pathsComplete).toBe(true);
  });

  it("adds thank-you page views, and knows when a list was cut off", () => {
    const counts = customerCounts(data, { event: "purchase", page: "/thanks" });
    expect(counts.sources.find((s) => s.source === "google")?.last).toBe(11);
    expect(counts.sources.find((s) => s.source === "reddit.com")?.first).toBe(8);
    expect(counts.pathsComplete).toBe(false);
  });

  it("knows only last visits when GA4 didn't answer for first visits", () => {
    const counts = customerCounts(
      { ...data, firstGoals: null, goalPaths: null },
      { event: "purchase", page: null },
    );
    expect(counts.hasFirst).toBe(false);
    expect(counts.paths).toBeNull();
    expect(counts.sources.map((s) => s.first)).toEqual([0, 0]);
  });
});
