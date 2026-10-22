import { describe, expect, it } from "vitest";
import { legal, operator } from "./legal";

describe("legal facts", () => {
  it("never hold a [PLACEHOLDER]", () => {
    for (const [key, value] of Object.entries(legal)) {
      expect(String(value), key).not.toMatch(/\[[^\]]*\]/);
    }
  });

  it("name who runs SimpleDash in one line", () => {
    expect(operator()).toBe("Koochak Art, Lauriergracht 116 D2, 1016 RP Amsterdam, the Netherlands");
  });
});
