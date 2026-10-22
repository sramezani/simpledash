import { describe, expect, it } from "vitest";
import { parseLive, parseLiveCount } from "./live";

const res = (dims: string[], rows: (string | number)[][], metric = "activeUsers") => ({
  dimensionHeaders: dims.map((name) => ({ name })),
  metricHeaders: [{ name: metric }],
  rows: rows.map((v) => ({
    dimensionValues: v.slice(0, dims.length).map((x) => ({ value: String(x) })),
    metricValues: [{ value: String(v[dims.length]) }],
  })),
});
const empty = { rows: [] };

describe("parseLiveCount", () => {
  it("counts everyone right now", () => {
    expect(parseLiveCount(res([], [[12]]), 30)).toEqual({ total: 12, minutes: 30 });
    expect(parseLiveCount(empty, 60)).toEqual({ total: 0, minutes: 60 });
  });
});

describe("parseLive", () => {
  const live = parseLive(
    {
      total: res([], [[12]]),
      places: res(
        ["countryId", "country", "city"],
        [
          ["NL", "Netherlands", "Amsterdam", 3],
          ["NL", "Netherlands", "(not set)", 2],
          ["NL", "Netherlands", "Tiny Village", 1],
          ["US", "United States", "New York", 4],
          ["ZZ", "Nowhere", "Nowhere", 9],
        ],
      ),
      pages: res(
        ["unifiedScreenName"],
        [
          ["Pricing · MySite", 2],
          ["Home · MySite", 5],
          ["(not set)", 1],
          ["", 1],
        ],
      ),
      devices: res(
        ["deviceCategory"],
        [
          ["desktop", 7],
          ["mobile", 4],
          ["smart tv", 1],
        ],
      ),
      minutes: res(
        ["minutesAgo"],
        [
          ["00", 2],
          ["03", 1],
          ["29", 4],
          ["45", 9],
        ],
      ),
      events: res(
        ["eventName"],
        [
          ["page_view", 30],
          ["sign_up", 2],
        ],
        "eventCount",
      ),
    },
    30,
  );

  it("counts everyone right now", () => {
    expect(live.total).toBe(12);
    expect(live.minutes).toBe(30);
  });

  it("puts places on the globe, merging those that share a point", () => {
    expect(live.places).toEqual([
      {
        lat: 40.71,
        lng: -74.01,
        visitors: 4,
        label: "New York, United States",
        countryCode: "US",
      },
      { lat: 52.37, lng: 4.89, visitors: 3, label: "Amsterdam, Netherlands", countryCode: "NL" },
      expect.objectContaining({ visitors: 3, label: "Netherlands", countryCode: "NL" }),
    ]);
  });

  it("lists live pages by title, busiest first", () => {
    expect(live.pages).toEqual([
      { title: "Home · MySite", visitors: 5 },
      { title: "Pricing · MySite", visitors: 2 },
      { title: "Unknown", visitors: 2 },
    ]);
  });

  it("names devices in plain words", () => {
    expect(live.devices).toEqual([
      { device: "desktop", label: "Desktop", visitors: 7 },
      { device: "mobile", label: "Mobile", visitors: 4 },
      { device: "other", label: "Other", visitors: 1 },
    ]);
  });

  it("lays visitors out per minute, oldest first, with quiet minutes at zero", () => {
    expect(live.perMinute).toHaveLength(30);
    expect(live.perMinute[29]).toBe(2);
    expect(live.perMinute[26]).toBe(1);
    expect(live.perMinute[0]).toBe(4);
    expect(live.perMinute.reduce((a, b) => a + b, 0)).toBe(7);
  });

  it("keeps event counts by name", () => {
    expect(live.events).toEqual({ page_view: 30, sign_up: 2 });
  });

  it("handles a quiet moment", () => {
    const quiet = parseLive(
      { total: empty, places: empty, pages: empty, devices: empty, minutes: empty, events: empty },
      60,
    );
    expect(quiet).toEqual({
      total: 0,
      minutes: 60,
      places: [],
      pages: [],
      devices: [],
      perMinute: Array.from({ length: 60 }, () => 0),
      events: {},
    });
  });
});
