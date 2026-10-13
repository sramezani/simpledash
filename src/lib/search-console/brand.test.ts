import { describe, expect, it } from "vitest";
import { baseName, brandPattern, brandTerms, readBrandTerms } from "./brand";

describe("baseName", () => {
  it("takes the name from the domain", () => {
    expect(baseName("meetline.me")).toBe("meetline");
    expect(baseName("www.simpledash.app")).toBe("simpledash");
    expect(baseName("blog.example.com")).toBe("example");
    expect(baseName("shop.example.co.uk")).toBe("example");
    expect(baseName(null)).toBeNull();
  });
});

describe("brandTerms", () => {
  it("spells a hyphenated name three ways, then adds the user's spellings", () => {
    expect(brandTerms("simple-dash.app", ["Simple  Dash App", "simpledash"])).toEqual([
      "simple-dash",
      "simple dash",
      "simpledash",
      "simple dash app",
    ]);
  });
});

describe("brandPattern", () => {
  it("matches the name anywhere in a search, case aside", () => {
    const re = new RegExp(brandPattern(["meetline", "meet line"])!.replace("(?i)", ""), "i");
    expect(re.test("meetline pricing")).toBe(true);
    expect(re.test("is meet line free")).toBe(true);
    expect(re.test("meeting tools")).toBe(false);
  });

  it("matches short names only as whole words", () => {
    const re = new RegExp(brandPattern(["go"])!.replace("(?i)", ""), "i");
    expect(re.test("go dev")).toBe(true);
    expect(re.test("google analytics")).toBe(false);
  });

  it("escapes characters with a meaning in patterns", () => {
    expect(brandPattern(["c++ jobs", "a.b"])).toBe("(?i)(c\\+\\+ jobs|\\ba\\.b\\b)");
    expect(brandPattern([])).toBeNull();
  });
});

describe("readBrandTerms", () => {
  it("reads commas and lines, lowercase, without repeats, 2–40 characters, at most 10", () => {
    expect(readBrandTerms(" Meet Line,meetline\n x ,meetline app, MEET LINE ")).toEqual([
      "meet line",
      "meetline",
      "meetline app",
    ]);
    expect(readBrandTerms(Array.from({ length: 14 }, (_, i) => `name${i}`).join(","))).toHaveLength(
      10,
    );
    expect(readBrandTerms("a".repeat(41))).toEqual([]);
  });
});
