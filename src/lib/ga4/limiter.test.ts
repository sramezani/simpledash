import { beforeEach, describe, expect, it } from "vitest";
import { allowPublicCustomRange, PUBLIC_CUSTOM_LIMIT, resetLimiter } from "./limiter";

const HOUR = 3_600_000;

describe("allowPublicCustomRange", () => {
  beforeEach(() => resetLimiter());

  it("allows a set number of new custom ranges an hour per property", () => {
    for (let i = 0; i < PUBLIC_CUSTOM_LIMIT; i++) {
      expect(
        allowPublicCustomRange("p1", `2026-09-${String(i + 1).padStart(2, "0")}..2026-09-30`, 0),
      ).toBe(true);
    }
    expect(allowPublicCustomRange("p1", "2026-08-01..2026-08-31", 0)).toBe(false);
    // Another property has its own count.
    expect(allowPublicCustomRange("p2", "2026-08-01..2026-08-31", 0)).toBe(true);
  });

  it("always allows a range asked for within the hour, and frees room after an hour", () => {
    for (let i = 0; i < PUBLIC_CUSTOM_LIMIT; i++) {
      allowPublicCustomRange("p1", `2026-07-${String(i + 1).padStart(2, "0")}..2026-07-31`, 0);
    }
    expect(allowPublicCustomRange("p1", "2026-07-01..2026-07-31", HOUR / 2)).toBe(true);
    expect(allowPublicCustomRange("p1", "2026-06-01..2026-06-30", HOUR / 2)).toBe(false);
    expect(allowPublicCustomRange("p1", "2026-06-01..2026-06-30", HOUR + 1)).toBe(true);
  });
});
