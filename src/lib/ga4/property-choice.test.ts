import { describe, expect, it } from "vitest";
import { enumIs, hostnameFromUri, mapLimit, pickBusiest, toDate } from "./property-choice";

describe("pickBusiest", () => {
  it("picks the most visitors, the first on a tie, and ignores failed checks", () => {
    expect(pickBusiest([10, 50, 30])).toBe(1);
    expect(pickBusiest([50, 50])).toBe(0);
    expect(pickBusiest([null, 3, null])).toBe(1);
    expect(pickBusiest([null, null])).toBe(0);
    expect(pickBusiest([0, 0, 0])).toBe(0);
  });
});

describe("hostnameFromUri", () => {
  it("turns the web stream URL into the label", () => {
    expect(hostnameFromUri("https://www.mysite.com")).toBe("mysite.com");
    expect(hostnameFromUri("https://app.mysite.com/path?q=1")).toBe("app.mysite.com");
    expect(hostnameFromUri("mysite.com")).toBe("mysite.com");
    expect(hostnameFromUri("")).toBeNull();
    expect(hostnameFromUri(null)).toBeNull();
  });
});

describe("toDate and enumIs", () => {
  it("reads both timestamp shapes", () => {
    expect(toDate({ seconds: "1700000000", nanos: 0 })?.toISOString()).toBe(
      "2023-11-14T22:13:20.000Z",
    );
    expect(toDate("2024-01-01T00:00:00Z")?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(toDate(undefined)).toBeNull();
    expect(toDate("nope")).toBeNull();
  });

  it("matches enums by name or number", () => {
    expect(enumIs("WEB_DATA_STREAM", "WEB_DATA_STREAM", 1)).toBe(true);
    expect(enumIs(1, "WEB_DATA_STREAM", 1)).toBe(true);
    expect(enumIs(2, "WEB_DATA_STREAM", 1)).toBe(false);
  });
});

describe("mapLimit", () => {
  it("keeps order and runs at most `limit` at once", async () => {
    let running = 0;
    let peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 5, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 3));
      running--;
      return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]);
    expect(peak).toBe(5);
  });
});
