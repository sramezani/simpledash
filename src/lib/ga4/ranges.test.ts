import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  comparisonGap,
  daysIn,
  endOfMonth,
  freshnessNote,
  hourIn,
  keyToDate,
  keyToHour,
  lacksHistory,
  parseRange,
  rangeMenu,
  rangeWindow,
  seriesKeys,
  todayIn,
} from "./ranges";

describe("todayIn", () => {
  it("uses the site's time zone, not the server's", () => {
    const now = new Date("2026-10-11T23:30:00Z");
    expect(todayIn("UTC", now)).toBe("2026-10-11");
    expect(todayIn("Europe/Amsterdam", now)).toBe("2026-10-12");
    expect(todayIn("America/Los_Angeles", now)).toBe("2026-10-11");
    expect(todayIn("Pacific/Kiritimati", new Date("2026-10-11T10:30:00Z"))).toBe("2026-10-12");
  });
});

describe("date arithmetic", () => {
  it("handles month and year ends and leap years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-01");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-01");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
    expect(daysIn({ start: "2026-10-01", end: "2026-10-07" })).toBe(7);
  });

  it("is not affected by daylight-saving changes", () => {
    // Europe moves clocks back on 25 Oct 2026.
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(daysIn({ start: "2026-10-20", end: "2026-10-30" })).toBe(11);
  });
});

describe("rangeWindow", () => {
  const now = new Date("2026-10-11T12:00:00Z");

  it("7 days ends yesterday, compared with the 7 days before, daily", () => {
    const w = rangeWindow("7d", "UTC", now);
    expect(w.current).toEqual({ start: "2026-10-04", end: "2026-10-10" });
    expect(w.previous).toEqual({ start: "2026-09-27", end: "2026-10-03" });
    expect(w.granularity).toBe("date");
    expect(w.includesYesterday).toBe(true);
    expect(daysIn(w.current)).toBe(7);
  });

  it("30 days ends yesterday, daily", () => {
    const w = rangeWindow("30d", "UTC", now);
    expect(w.current).toEqual({ start: "2026-09-11", end: "2026-10-10" });
    expect(w.previous).toEqual({ start: "2026-08-12", end: "2026-09-10" });
    expect(daysIn(w.previous)).toBe(30);
    expect(w.granularity).toBe("date");
  });

  it("12 months is the last 12 full calendar months, monthly", () => {
    const w = rangeWindow("12m", "UTC", now);
    expect(w.current).toEqual({ start: "2025-10-01", end: "2026-09-30" });
    expect(w.previous).toEqual({ start: "2024-10-01", end: "2025-09-30" });
    expect(w.granularity).toBe("yearMonth");
    expect(w.includesYesterday).toBe(false);
  });

  it("12 months includes yesterday on the first of the month", () => {
    const w = rangeWindow("12m", "UTC", new Date("2026-11-01T12:00:00Z"));
    expect(w.current.end).toBe("2026-10-31");
    expect(w.includesYesterday).toBe(true);
  });

  it("follows the site's time zone around midnight", () => {
    const late = new Date("2026-10-11T23:30:00Z");
    expect(rangeWindow("7d", "UTC", late).current.end).toBe("2026-10-10");
    expect(rangeWindow("7d", "Europe/Amsterdam", late).current.end).toBe("2026-10-11");
  });

  it("works across a new year", () => {
    const w = rangeWindow("7d", "UTC", new Date("2027-01-03T08:00:00Z"));
    expect(w.current).toEqual({ start: "2026-12-27", end: "2027-01-02" });
  });
});

describe("seriesKeys", () => {
  it("makes 7 daily keys for 7 days", () => {
    const keys = seriesKeys(rangeWindow("7d", "UTC", new Date("2026-10-11T12:00:00Z")));
    expect(keys).toEqual([
      "20261004",
      "20261005",
      "20261006",
      "20261007",
      "20261008",
      "20261009",
      "20261010",
    ]);
  });

  it("makes daily and monthly keys", () => {
    const now = new Date("2026-10-11T12:00:00Z");
    expect(seriesKeys(rangeWindow("30d", "UTC", now))).toHaveLength(30);
    const months = seriesKeys(rangeWindow("12m", "UTC", now));
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("202510");
    expect(months.at(-1)).toBe("202609");
  });

  it("turns keys back into dates", () => {
    expect(keyToDate("20261004")).toBe("2026-10-04");
    expect(keyToDate("202610")).toBe("2026-10-01");
  });
});

describe("parseRange", () => {
  it("accepts the five ranges and defaults to 7 days", () => {
    expect(parseRange("30d")).toBe("30d");
    expect(parseRange(["12m"])).toBe("12m");
    expect(parseRange("today")).toBe("today");
    expect(parseRange("yesterday")).toBe("yesterday");
    expect(parseRange("1y")).toBe("7d");
    expect(parseRange(undefined)).toBe("7d");
  });

  it("takes another default where a page has one (the demo)", () => {
    expect(parseRange(undefined, "12m")).toBe("12m");
    expect(parseRange("30d", "12m")).toBe("30d");
  });
});

describe("today and yesterday", () => {
  const now = new Date("2026-10-11T14:30:00Z");

  it("today is today so far, hourly, compared with yesterday", () => {
    const w = rangeWindow("today", "UTC", now);
    expect(w.current).toEqual({ start: "2026-10-11", end: "2026-10-11" });
    expect(w.previous).toEqual({ start: "2026-10-10", end: "2026-10-10" });
    expect(w.granularity).toBe("dateHour");
    expect(w.lastHour).toBe(14);
    expect(w.lastPointPending).toBe(true);
    expect(w.includesYesterday).toBe(false);
  });

  it("yesterday is one full day, hourly, compared with the day before", () => {
    const w = rangeWindow("yesterday", "UTC", now);
    expect(w.current).toEqual({ start: "2026-10-10", end: "2026-10-10" });
    expect(w.previous).toEqual({ start: "2026-10-09", end: "2026-10-09" });
    expect(w.lastHour).toBe(23);
    expect(w.lastPointPending).toBe(false);
    expect(w.includesYesterday).toBe(true);
  });

  it("uses the hour in the site's time zone", () => {
    expect(hourIn("UTC", now)).toBe(14);
    expect(hourIn("Europe/Amsterdam", now)).toBe(16);
    expect(hourIn("UTC", new Date("2026-10-11T00:05:00Z"))).toBe(0);
    expect(rangeWindow("today", "Europe/Amsterdam", now).lastHour).toBe(16);
  });

  it("makes one key per hour, up to now for today", () => {
    const today = seriesKeys(rangeWindow("today", "UTC", now));
    expect(today).toHaveLength(15);
    expect(today[0]).toBe("2026101100");
    expect(today.at(-1)).toBe("2026101114");
    expect(seriesKeys(rangeWindow("yesterday", "UTC", now))).toHaveLength(24);
    expect(keyToHour("2026101114")).toBe(14);
    expect(keyToDate("2026101114")).toBe("2026-10-11");
  });
});

describe("comparisonGap", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  it("never compares today, which isn't over", () => {
    expect(comparisonGap(rangeWindow("today", "UTC", now), null)).toBe("Today isn't over yet");
  });
  it("needs history for the period before", () => {
    const w = rangeWindow("7d", "UTC", now);
    expect(comparisonGap(w, new Date("2026-10-01T00:00:00Z"))).toBe(
      "Not enough history to compare",
    );
    expect(comparisonGap(w, null)).toBeNull();
    expect(comparisonGap(rangeWindow("yesterday", "UTC", now), null)).toBeNull();
  });
});

describe("rangeMenu", () => {
  it("links each range, leaving out ?range= for the default", () => {
    const menu = rangeMenu("/dashboard");
    expect(menu.map((o) => o.value)).toEqual(["today", "yesterday", "7d", "30d", "12m"]);
    expect(menu.find((o) => o.value === "7d")?.href).toBe("/dashboard");
    expect(menu.find((o) => o.value === "today")?.href).toBe("/dashboard?range=today");
    expect(menu.filter((o) => o.separated).map((o) => o.value)).toEqual(["7d"]);
  });

  it("keeps other search params and a page's own default", () => {
    const menu = rangeMenu("/demo", { embed: "1" }, "12m");
    expect(menu.find((o) => o.value === "12m")?.href).toBe("/demo?embed=1");
    expect(menu.find((o) => o.value === "7d")?.href).toBe("/demo?embed=1&range=7d");
  });
});

describe("freshnessNote", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  it("says what is still coming in", () => {
    expect(freshnessNote(rangeWindow("today", "UTC", now))).toMatch(/^So far today/);
    expect(freshnessNote(rangeWindow("7d", "UTC", now))).toBe(
      "Google may still be adding to yesterday.",
    );
    expect(freshnessNote(rangeWindow("12m", "UTC", now))).toBeNull();
  });
});

describe("lacksHistory", () => {
  const w = rangeWindow("7d", "UTC", new Date("2026-10-11T12:00:00Z"));
  it("is true when the property was created after the previous period started", () => {
    expect(lacksHistory(w, new Date("2026-10-01T00:00:00Z"))).toBe(true);
    expect(lacksHistory(w, new Date("2026-09-27T00:00:00Z"))).toBe(false);
    expect(lacksHistory(w, null)).toBe(false);
  });
});
