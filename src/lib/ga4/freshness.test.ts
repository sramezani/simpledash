import { describe, expect, it } from "vitest";
import { durationWords, FRESHNESS } from "./freshness";

describe("FRESHNESS", () => {
  it("keeps a range that ends today fresh the shortest, public pages longer than the dashboard", () => {
    expect(durationWords(FRESHNESS.endsToday.owner)).toBe("30 minutes");
    expect(durationWords(FRESHNESS.endsToday.public)).toBe("1 hour");
    expect(durationWords(FRESHNESS.recent.owner)).toBe("3 hours");
    expect(durationWords(FRESHNESS.recent.public)).toBe("12 hours");
    expect(durationWords(FRESHNESS.settled.owner)).toBe("24 hours");
  });
});
