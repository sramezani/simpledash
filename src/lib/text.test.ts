import { describe, expect, it } from "vitest";
import { fold, matchesSearch } from "./text";

describe("fold", () => {
  it("drops accents and case", () => {
    expect(fold("São Paulo")).toBe("sao paulo");
    expect(fold("ÉCOLE")).toBe("ecole");
  });
});

describe("matchesSearch", () => {
  it("matches every word, in any of the texts, in any order", () => {
    expect(matchesSearch("blog prod", "My blog", "Production account")).toBe(true);
    expect(matchesSearch("prod blog", "My blog", "Production account")).toBe(true);
    expect(matchesSearch("shop", "My blog", "Production account")).toBe(false);
  });

  it("matches everything for an empty query, and ignores missing texts", () => {
    expect(matchesSearch("  ", "anything")).toBe(true);
    expect(matchesSearch("sao", null, "São Paulo", undefined)).toBe(true);
  });
});
