import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  comparisonGap,
  isIsoDay,
  MAX_CUSTOM_DAYS,
  previousPeriodWords,
  rangeLabel,
  daysIn,
  endOfMonth,
  fitsFreeHistory,
  freeFirstDay,
  freshnessNote,
  hourIn,
  keyToDate,
  keyToHour,
  lacksHistory,
  parseRange,
  rangeForPlan,
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
  const w = rangeWindow("7d", "UTC", new Date("2026-10-11T12:00:00Z"));

  it("links each preset with its key, leaving out ?range= for the default", () => {
    const { presets, value, label } = rangeMenu("7d", w, "/dashboard");
    expect(value).toBe("7d");
    expect(label).toBe("Last 7 days");
    expect(presets.map((o) => o.value)).toEqual(["today", "yesterday", "7d", "30d", "12m"]);
    expect(presets.map((o) => o.shortcut)).toEqual(["T", "Y", "W", "M", "L"]);
    expect(presets.find((o) => o.value === "7d")?.href).toBe("/dashboard");
    expect(presets.find((o) => o.value === "today")?.href).toBe("/dashboard?range=today");
    expect(presets.filter((o) => o.separated).map((o) => o.value)).toEqual(["7d"]);
  });

  it("keeps other search params and a page's own default", () => {
    const { presets, custom } = rangeMenu("12m", w, "/demo", { embed: "1" }, "12m");
    expect(presets.find((o) => o.value === "12m")?.href).toBe("/demo?embed=1");
    expect(presets.find((o) => o.value === "7d")?.href).toBe("/demo?embed=1&range=7d");
    expect(custom.href.replace(custom.slot, "2026-09-01..2026-09-30")).toBe(
      "/demo?embed=1&range=2026-09-01..2026-09-30",
    );
  });

  it("starts the calendar on the period shown and stops it at today", () => {
    const { custom, label } = rangeMenu("2026-09-01..2026-09-30", w, "/dashboard");
    expect(label).toBe("1 Sep – 30 Sep");
    expect(custom).toMatchObject({
      start: "2026-10-04",
      end: "2026-10-10",
      firstDay: "2015-08-14",
      lastDay: "2026-10-11",
    });
  });
});

describe("Free's 30 days", () => {
  const today = "2026-10-11";
  const now = new Date("2026-10-11T12:00:00Z");

  it("starts on the first day of Last 30 days", () => {
    expect(freeFirstDay(today)).toBe("2026-09-11");
    expect(rangeWindow("30d", "UTC", now).current.start).toBe(freeFirstDay(today));
  });

  it("fits every preset but 12 months, and custom days inside the 30 days", () => {
    for (const r of ["today", "yesterday", "7d", "30d"] as const) {
      expect(fitsFreeHistory(r, today)).toBe(true);
    }
    expect(fitsFreeHistory("12m", today)).toBe(false);
    expect(fitsFreeHistory("2026-09-11..2026-10-11", today)).toBe(true);
    expect(fitsFreeHistory("2026-09-10..2026-09-20", today)).toBe(false);
  });

  it("swaps a longer range for Last 30 days on Free only", () => {
    expect(rangeForPlan("12m", false, "UTC", now)).toEqual({ range: "30d", limited: true });
    expect(rangeForPlan("2025-01-01..2025-01-31", false, "UTC", now)).toEqual({
      range: "30d",
      limited: true,
    });
    expect(rangeForPlan("7d", false, "UTC", now)).toEqual({ range: "7d", limited: false });
    expect(rangeForPlan("12m", true, "UTC", now)).toEqual({ range: "12m", limited: false });
  });

  it("uses the site's own today", () => {
    // 01:00 on 12 Oct in Tokyo is still 11 Oct in UTC.
    const early = new Date("2026-10-11T16:00:00Z");
    expect(rangeForPlan("2026-09-11..2026-09-12", false, "Asia/Tokyo", early).limited).toBe(true);
    expect(rangeForPlan("2026-09-12..2026-09-13", false, "Asia/Tokyo", early).limited).toBe(false);
  });

  it("locks 12 months in the dashboard menu and stops the calendar 30 days back", () => {
    const w = rangeWindow("7d", "UTC", now);
    const menu = rangeMenu("7d", w, "/dashboard", {}, "7d", {
      firstDay: freeFirstDay(w.today),
      upgradeHref: "/settings/billing",
    });
    expect(menu.presets.find((p) => p.value === "12m")).toMatchObject({
      locked: true,
      href: "/settings/billing",
    });
    expect(menu.presets.filter((p) => p.locked).map((p) => p.value)).toEqual(["12m"]);
    expect(menu.custom.firstDay).toBe("2026-09-11");
    expect(menu.limit).toEqual({
      note: "Free shows the last 30 days.",
      href: "/settings/billing",
    });
  });

  it("leaves 12 months out of a public page's menu, with no upgrade note", () => {
    const w = rangeWindow("7d", "UTC", now);
    const menu = rangeMenu("7d", w, "/p/x", {}, "7d", { firstDay: freeFirstDay(w.today) });
    expect(menu.presets.map((p) => p.value)).toEqual(["today", "yesterday", "7d", "30d"]);
    expect(menu.limit).toBeNull();
    expect(rangeMenu("7d", w, "/dashboard").limit).toBeNull();
    expect(rangeMenu("7d", w, "/dashboard").presets.every((p) => !p.locked)).toBe(true);
  });
});

describe("custom ranges", () => {
  const now = new Date("2026-10-11T14:30:00Z");

  it("reads valid ranges from ?range=, in order, and refuses the rest", () => {
    expect(parseRange("2026-09-01..2026-09-30")).toBe("2026-09-01..2026-09-30");
    expect(parseRange("2026-09-30..2026-09-01")).toBe("2026-09-01..2026-09-30");
    expect(parseRange("2010-01-01..2016-01-01")).toBe("2015-08-14..2016-01-01");
    for (const bad of ["2026-02-30..2026-03-01", "2026-9-1..2026-9-30", "x..y", "2026-09-01"]) {
      expect(parseRange(bad), bad).toBe("7d");
    }
    expect(isIsoDay("2028-02-29")).toBe(true);
    expect(isIsoDay("2027-02-29")).toBe(false);
  });

  it("is compared with the same number of days just before", () => {
    const w = rangeWindow("2026-09-01..2026-09-30", "UTC", now);
    expect(w.current).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(w.previous).toEqual({ start: "2026-08-02", end: "2026-08-31" });
    expect(w.granularity).toBe("date");
    expect(w.includesYesterday).toBe(false);
    expect(w.lastPointPending).toBe(false);
    expect(comparisonGap(w, null)).toBeNull();
    expect(previousPeriodWords("2026-09-01..2026-09-30")).toBe("the 30 days before");
  });

  it("is hourly for one day, daily up to about 3 months, monthly after", () => {
    expect(rangeWindow("2026-09-14..2026-09-14", "UTC", now).granularity).toBe("dateHour");
    expect(rangeWindow("2026-07-01..2026-09-30", "UTC", now).granularity).toBe("date");
    expect(rangeWindow("2025-01-01..2026-09-30", "UTC", now).granularity).toBe("yearMonth");
    expect(rangeLabel("2026-09-14..2026-09-14")).toBe("Mon 14 Sep");
    expect(previousPeriodWords("2026-09-14..2026-09-14")).toBe("the day before");
  });

  it("stops at today, and a range ending today isn't compared", () => {
    const w = rangeWindow("2026-10-01..2026-12-31", "UTC", now);
    expect(w.current.end).toBe("2026-10-11");
    expect(w.endsToday).toBe(true);
    expect(w.includesYesterday).toBe(true);
    expect(comparisonGap(w, null)).toBe("Today isn't over yet");
    expect(freshnessNote(w)).toMatch(/^Includes today so far/);
    const today = rangeWindow("2026-10-11..2026-10-11", "UTC", now);
    expect(today.granularity).toBe("dateHour");
    expect(today.lastHour).toBe(14);
  });

  it("is at most about 5 years", () => {
    const w = rangeWindow("2015-08-14..2026-09-30", "UTC", now);
    expect(w.current.end).toBe("2026-09-30");
    expect(daysIn(w.current)).toBe(MAX_CUSTOM_DAYS);
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
