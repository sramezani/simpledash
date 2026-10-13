import { describe, expect, it } from "vitest";
import {
  formatAgo,
  formatCompact,
  formatMoney,
  formatPosition,
  formatRate,
  formatDate,
  formatDay,
  formatDayRange,
  formatDuration,
  formatMonth,
  formatNumber,
  formatPercent,
  formatPrice,
  formatShare,
  formatTime,
  percentChange,
} from "./format";

describe("numbers", () => {
  it("formats whole numbers with thousands separators", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999.6)).toBe("1,000");
  });

  it("keeps small numbers exact in compact form", () => {
    expect(formatCompact(9999)).toBe("9,999");
    expect(formatCompact(123456)).toBe("123.5K");
    expect(formatCompact(1_250_000)).toBe("1.3M");
  });

  it("formats shares of a total", () => {
    expect(formatShare(1, 4)).toBe("25%");
    expect(formatShare(5, 0)).toBe("0%");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0s"],
    [45, "45s"],
    [83, "1m 23s"],
    [120, "2m"],
    [3900, "1h 5m"],
    [7200, "2h"],
    [-5, "0s"],
  ])("%s seconds → %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("percentChange", () => {
  it("rounds to a whole number", () => {
    expect(percentChange(123, 100)).toBe(23);
    expect(percentChange(88, 100)).toBe(-12);
    expect(percentChange(1001, 1000)).toBe(0);
  });

  it("never makes up a percentage when there is nothing to compare with", () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(10, null)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });

  it("shows the size, not the sign (the arrow and word carry the direction)", () => {
    expect(formatPercent(-12)).toBe("12%");
    expect(formatPercent(23)).toBe("23%");
  });

  it("doesn't produce -0", () => {
    expect(Object.is(percentChange(999, 1000), 0)).toBe(true);
  });
});

describe("dates", () => {
  it("formats days, months and ranges", () => {
    expect(formatDay("2026-10-04")).toBe("4 Oct");
    expect(formatDay("2026-10-04", true)).toBe("4 Oct 2026");
    expect(formatMonth("2026-01")).toBe("Jan 2026");
    expect(formatDayRange("2026-10-04", "2026-10-10")).toBe("4 Oct – 10 Oct");
    expect(formatDayRange("2025-12-29", "2026-01-04")).toBe("29 Dec 2025 – 4 Jan 2026");
  });

  it("formats a date and a time in a time zone", () => {
    const d = new Date("2027-10-11T22:30:00Z");
    expect(formatDate(d, "UTC")).toBe("11 Oct 2027");
    expect(formatDate(d, "Europe/Amsterdam")).toBe("12 Oct 2027");
    expect(formatTime(d, "Europe/Amsterdam")).toBe("00:30");
  });
});

describe("formatPrice", () => {
  it("shows whole euros without decimals", () => {
    expect(formatPrice(9)).toBe("€9");
    expect(formatPrice(90)).toBe("€90");
    expect(formatPrice(7.5)).toBe("€7.50");
  });
});

describe("search numbers", () => {
  it("writes click rates with sensible precision", () => {
    expect(formatRate(0.0213)).toBe("2.1%");
    expect(formatRate(0.153)).toBe("15%");
    expect(formatRate(0.0004)).toBe("0.04%");
    expect(formatRate(0)).toBe("0%");
  });

  it("writes positions like Search Console", () => {
    expect(formatPosition(11.23)).toBe("11.2");
    expect(formatPosition(1)).toBe("1");
    expect(formatPosition(7.96)).toBe("8");
  });
});

describe("formatMoney", () => {
  it("shows amounts from the smallest unit, cents only when they matter", () => {
    expect(formatMoney(123456, "EUR")).toBe("€1,235");
    expect(formatMoney(1990, "EUR")).toBe("€19.90");
    expect(formatMoney(1900, "EUR")).toBe("€19");
    expect(formatMoney(500, "JPY")).toBe("JP¥500");
    expect(formatMoney(-900, "USD")).toBe("-US$9");
  });
});

describe("formatAgo", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  it("says how long ago in plain words", () => {
    expect(formatAgo(new Date("2026-10-13T11:59:40Z"), now)).toBe("just now");
    expect(formatAgo(new Date("2026-10-13T11:48:00Z"), now)).toBe("12 minutes ago");
    expect(formatAgo(new Date("2026-10-13T09:00:00Z"), now)).toBe("3 hours ago");
    expect(formatAgo(new Date("2026-10-10T09:00:00Z"), now)).toBe("on 10 Oct 2026");
  });
});
