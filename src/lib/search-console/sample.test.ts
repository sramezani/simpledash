import { describe, expect, it } from "vitest";
import { sampleSearchCard } from "./sample";

describe("sampleSearchCard", () => {
  it("gives every view something to show", () => {
    const card = sampleSearchCard({ start: "2026-10-06", end: "2026-10-12" });
    expect(card.window.current).toEqual({ start: "2026-10-04", end: "2026-10-10" });
    expect(card.insights.near.count).toBeGreaterThan(5);
    expect(card.insights.changed.rising.length).toBeGreaterThan(0);
    expect(card.insights.changed.falling.length).toBeGreaterThan(0);
    expect(card.insights.unclicked.pages.map((p) => p.label)).toContain("/docs/api");
    expect(card.brand.current.brand).toBeGreaterThan(0);
    expect(card.landing?.rows.length).toBeGreaterThan(0);
  });
});
