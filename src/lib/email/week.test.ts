import { describe, expect, it } from "vitest";
import { isSendTime, localTime } from "./week";

describe("isSendTime", () => {
  it("is Monday from 13:00 to 17:59 in the site's time zone", () => {
    // 12 Oct 2026 is a Monday. Amsterdam is UTC+2 in October.
    expect(isSendTime(new Date("2026-10-12T11:00:00Z"), "Europe/Amsterdam")).toBe(true); // 13:00
    expect(isSendTime(new Date("2026-10-12T15:59:00Z"), "Europe/Amsterdam")).toBe(true); // 17:59
    expect(isSendTime(new Date("2026-10-12T10:59:00Z"), "Europe/Amsterdam")).toBe(false); // 12:59
    expect(isSendTime(new Date("2026-10-12T16:00:00Z"), "Europe/Amsterdam")).toBe(false); // 18:00
  });

  it("follows the site's day, not UTC's", () => {
    // Monday 13:00 in Auckland is still Sunday in UTC.
    expect(isSendTime(new Date("2026-10-12T00:00:00Z"), "Pacific/Auckland")).toBe(true);
    expect(isSendTime(new Date("2026-10-13T00:00:00Z"), "Pacific/Auckland")).toBe(false); // Tuesday
  });

  it("works for half-hour time zones", () => {
    // India is UTC+5:30: 08:00 UTC is 13:30 local.
    expect(isSendTime(new Date("2026-10-12T08:00:00Z"), "Asia/Kolkata")).toBe(true);
    expect(localTime(new Date("2026-10-12T08:00:00Z"), "Asia/Kolkata")).toEqual({
      weekday: 1,
      hour: 13,
    });
  });
});
