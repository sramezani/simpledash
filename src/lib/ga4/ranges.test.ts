import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  daysIn,
  endOfMonth,
  keyToDate,
  lacksHistory,
  parseRange,
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
  it("accepts the three ranges and defaults to 7 days", () => {
    expect(parseRange("30d")).toBe("30d");
    expect(parseRange(["12m"])).toBe("12m");
    expect(parseRange("1y")).toBe("7d");
    expect(parseRange(undefined)).toBe("7d");
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
