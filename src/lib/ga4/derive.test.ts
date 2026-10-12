import { describe, expect, it } from "vitest";
import { deriveStats } from "./derive";

const totals = {
  current: { visitors: 123, pageViews: 300, engagementSeconds: 123 * 83 },
  previous: { visitors: 100, pageViews: 300, engagementSeconds: 100 * 60 },
};
const actions = { current: { sign_up: 12 }, previous: { sign_up: 8 } };

describe("deriveStats", () => {
  it("works out the four numbers with % change", () => {
    const s = deriveStats(totals, actions, "sign_up", true)!;
    expect(s.visitors).toEqual({ value: 123, change: 23 });
    expect(s.pageViews).toEqual({ value: 300, change: 0 });
    expect(s.avgTime.value).toBe(83);
    expect(s.avgTime.change).toBe(38);
    expect(s.signups).toEqual({ value: 12, change: 50 });
    expect(s.noData).toBe(false);
  });

  it("never shows a signups number when no event is chosen", () => {
    expect(deriveStats(totals, actions, null, true)!.signups).toBeNull();
  });

  it("shows zero signups when the chosen event didn't happen", () => {
    expect(deriveStats(totals, { current: {}, previous: {} }, "sign_up", true)!.signups).toEqual({
      value: 0,
      change: null,
    });
  });

  it("drops every % when the previous period predates the property", () => {
    const s = deriveStats(totals, actions, "sign_up", false)!;
    expect(s.visitors.change).toBeNull();
    expect(s.signups?.change).toBeNull();
  });

  it("has no Avg. time without visitors, and flags no data", () => {
    const empty = {
      current: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
      previous: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
    };
    const s = deriveStats(empty, null, null, true)!;
    expect(s.avgTime).toEqual({ value: null, change: null });
    expect(s.visitors.change).toBeNull();
    expect(s.noData).toBe(true);
  });

  it("returns null without totals", () => {
    expect(deriveStats(null, null, null, true)).toBeNull();
  });
});
