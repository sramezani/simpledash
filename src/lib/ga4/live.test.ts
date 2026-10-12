import { describe, expect, it } from "vitest";
import { parseLive } from "./live";

const res = (dims: string[], rows: (string | number)[][]) => ({
  dimensionHeaders: dims.map((name) => ({ name })),
  metricHeaders: [{ name: "activeUsers" }],
  rows: rows.map((v) => ({
    dimensionValues: v.slice(0, dims.length).map((x) => ({ value: String(x) })),
    metricValues: [{ value: String(v[dims.length]) }],
  })),
});

describe("parseLive", () => {
  const live = parseLive(
    res([], [[12]]),
    res(
      ["countryId", "country", "city"],
      [
        ["NL", "Netherlands", "Amsterdam", 3],
        ["NL", "Netherlands", "(not set)", 2],
        ["NL", "Netherlands", "Tiny Village", 1],
        ["US", "United States", "New York", 4],
        ["ZZ", "Nowhere", "Nowhere", 9],
      ],
    ),
    res(
      ["unifiedScreenName"],
      [
        ["Pricing · MySite", 2],
        ["Home · MySite", 5],
        ["(not set)", 1],
        ["", 1],
      ],
    ),
    30,
  );

  it("counts everyone right now", () => {
    expect(live.total).toBe(12);
    expect(live.minutes).toBe(30);
  });

  it("puts places on the globe, merging those that share a point", () => {
    expect(live.places).toEqual([
      { lat: 40.71, lng: -74.01, visitors: 4, label: "New York, United States" },
      { lat: 52.37, lng: 4.89, visitors: 3, label: "Amsterdam, Netherlands" },
      expect.objectContaining({ visitors: 3, label: "Netherlands" }),
    ]);
  });

  it("lists live pages by title, busiest first", () => {
    expect(live.pages).toEqual([
      { title: "Home · MySite", visitors: 5 },
      { title: "Pricing · MySite", visitors: 2 },
      { title: "Unknown", visitors: 2 },
    ]);
  });

  it("handles a quiet moment", () => {
    const quiet = parseLive({ rows: [] }, { rows: [] }, { rows: [] }, 60);
    expect(quiet).toEqual({ total: 0, places: [], pages: [], minutes: 60 });
  });
});
