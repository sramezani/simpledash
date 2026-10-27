import { describe, expect, it } from "vitest";
import {
  dayFacts,
  dayShares,
  daySentence,
  lastDays,
  liveCountries,
  shortTitle,
  tickerItems,
  type FooterDay,
} from "./footer-data";

const series = (from: string, values: number[]) => ({
  granularity: "date" as const,
  points: values.map((visitors, i) => {
    const d = new Date(`${from}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { key: d.toISOString().slice(0, 10).replaceAll("-", ""), visitors };
  }),
});

describe("lastDays", () => {
  it("takes the last days of the chart, today last", () => {
    const days = lastDays(
      series("2026-10-20", [5, 6, 7, 8, 9, 10, 11, 12]),
      3,
      "2026-10-27",
      null,
    )!;
    expect(days).toEqual([
      { date: "2026-10-25", visitors: 10, today: false },
      { date: "2026-10-26", visitors: 11, today: false },
      { date: "2026-10-27", visitors: 12, today: true },
    ]);
  });

  it("has no number for days before the property existed, never a zero", () => {
    const days = lastDays(
      series("2026-10-20", [0, 0, 0, 0, 0, 0, 3, 4]),
      4,
      "2026-10-27",
      "2026-10-26",
    )!;
    expect(days.map((d) => d.visitors)).toEqual([null, null, 3, 4]);
  });

  it("has no number for days outside the chart", () => {
    const days = lastDays(series("2026-10-26", [3, 4]), 3, "2026-10-27", null)!;
    expect(days.map((d) => d.visitors)).toEqual([null, 3, 4]);
  });

  it("is null when no day has a number, or the chart isn't daily", () => {
    expect(lastDays(series("2026-10-26", [3, 4]), 2, "2026-10-27", "2026-10-28")).toBeNull();
    expect(
      lastDays(
        { ...series("2026-10-26", [3, 4]), granularity: "yearMonth" },
        2,
        "2026-10-27",
        null,
      ),
    ).toBeNull();
  });

  it("keeps real zeros", () => {
    const days = lastDays(series("2026-10-25", [0, 2, 0]), 3, "2026-10-27", null)!;
    expect(days.map((d) => d.visitors)).toEqual([0, 2, 0]);
  });
});

const day = (visitors: number | null, today = false, date = "2026-10-23"): FooterDay => ({
  date,
  visitors,
  today,
});

describe("dayShares", () => {
  it("measures every bar against the busiest day, from zero", () => {
    expect(dayShares([day(50), day(200), day(100), day(null)])).toEqual({
      shares: [0.25, 1, 0.5, 0],
      busiest: 1,
    });
  });

  it("has no busiest day when nobody came", () => {
    expect(dayShares([day(0), day(null)])).toEqual({ shares: [0, 0], busiest: null });
  });
});

describe("daySentence", () => {
  it("says the day and its visitors in plain words", () => {
    expect(daySentence(day(254), true, 10)).toBe(
      "Friday 23 October: 254 visitors, the busiest of these 10 days",
    );
    expect(daySentence(day(1), false, 10)).toBe("Friday 23 October: 1 visitor");
    expect(daySentence(day(1234), false, 10)).toBe("Friday 23 October: 1,234 visitors");
  });

  it("says today is still updating", () => {
    expect(daySentence(day(131, true), false, 10)).toBe(
      "Today so far: 131 visitors, still updating",
    );
    expect(daySentence(day(300, true), true, 10)).toBe(
      "Today so far: 300 visitors, still updating, already the busiest of these 10 days",
    );
  });

  it("says when there are no numbers yet", () => {
    expect(daySentence(day(null), false, 10)).toBe(
      "Friday 23 October: no numbers, Google Analytics wasn't counting yet",
    );
  });
});

describe("dayFacts", () => {
  const days = [
    day(100, false, "2026-10-24"),
    day(150, false, "2026-10-25"),
    day(150, false, "2026-10-26"),
    day(50, true, "2026-10-27"),
  ];

  it("compares a day with the day before", () => {
    expect(dayFacts(days, 1)).toMatchObject({ change: 50, previous: "2026-10-24" });
    expect(dayFacts(days, 2)).toMatchObject({ change: 0, previous: "2026-10-25" });
  });

  it("never compares today, or a day with nothing before it", () => {
    expect(dayFacts(days, 3)).toMatchObject({ change: null, previous: null });
    expect(dayFacts(days, 0)).toMatchObject({ change: null, previous: null });
    expect(dayFacts([day(0), day(5)], 1)).toMatchObject({ change: null });
  });

  it("ranks the day, ties sharing a place", () => {
    expect(dayFacts(days, 1).rank).toBe("Busiest of these 4 days");
    expect(dayFacts(days, 2).rank).toBe("Busiest of these 4 days");
    expect(dayFacts(days, 0).rank).toBe("3rd busiest of these 4 days");
  });

  it("calls the last day quietest, but never today", () => {
    const quiet = [day(100), day(20), day(150), day(10, true)];
    expect(dayFacts(quiet, 1).rank).toBe("3rd busiest of these 4 days");
    expect(dayFacts(quiet, 3).rank).toBeNull();
    expect(dayFacts([day(100), day(20), day(150)], 1).rank).toBe("Quietest of these 3 days");
    expect(dayFacts([day(300), day(20), day(400, true)], 2).rank).toBe(
      "Already the busiest of these 3 days",
    );
  });

  it("has no facts for a day without a number", () => {
    expect(dayFacts([day(null), day(5)], 0)).toEqual({ change: null, previous: null, rank: null });
    expect(dayFacts([day(null), day(5)], 1).change).toBeNull();
  });
});

const place = (countryCode: string, visitors: number) => ({
  lat: 0,
  lng: 0,
  visitors,
  label: countryCode,
  countryCode,
});

describe("liveCountries", () => {
  it("adds up cities per country, busiest first, and leaves out unknown codes", () => {
    expect(
      liveCountries([
        place("DE", 2),
        place("US", 3),
        place("DE", 2),
        place("", 5),
        place("ZZ", 1),
        place("XX", 1),
      ]),
    ).toEqual([
      { code: "DE", name: "Germany", visitors: 4 },
      { code: "US", name: "United States", visitors: 3 },
    ]);
  });
});

describe("shortTitle", () => {
  it("drops our name from the end and cuts long titles", () => {
    expect(shortTitle("Pricing · SimpleDash")).toBe("Pricing");
    expect(shortTitle("Docs | SimpleDash")).toBe("Docs");
    expect(shortTitle("SimpleDash: Google Analytics, in a dash.")).toBe(
      "SimpleDash: Google Analytics, in a dash.",
    );
    expect(shortTitle("A very long page title that goes on and on and on")).toBe(
      "A very long page title that goes on and…",
    );
  });
});

describe("tickerItems", () => {
  const live = {
    total: 23,
    minutes: 30,
    places: [place("US", 7), place("DE", 4)],
    pages: [
      { title: "Pricing · SimpleDash", visitors: 4 },
      { title: "Unknown", visitors: 2 },
    ],
    devices: [
      { device: "desktop" as const, label: "Desktop", visitors: 15 },
      { device: "mobile" as const, label: "Mobile", visitors: 8 },
      { device: "other" as const, label: "Other", visitors: 1 },
    ],
  };
  const all = { countries: true, pages: true, devices: true };

  it("starts with the live count, then countries, pages and devices", () => {
    expect(tickerItems(live, all).map((i) => [i.value, i.text])).toEqual([
      [23, "visitors in the last 30 minutes"],
      [7, "in United States"],
      [4, "in Germany"],
      [4, "reading “Pricing”"],
      [15, "on desktop"],
      [8, "on mobile"],
    ]);
    expect(tickerItems(live, all)[0]).toMatchObject({ live: true });
    expect(tickerItems(live, all)[1]).toMatchObject({ countryCode: "US" });
  });

  it("shows only the cards the public page shows", () => {
    const items = tickerItems(live, { countries: false, pages: true, devices: false });
    expect(items.map((i) => i.id)).toEqual(["total", "page-Pricing · SimpleDash"]);
  });

  it("is empty when nobody was there", () => {
    expect(tickerItems({ ...live, total: 0 }, all)).toEqual([]);
  });

  it("says one visitor", () => {
    expect(tickerItems({ ...live, total: 1 }, all)[0]!.text).toBe("visitor in the last 30 minutes");
  });
});
