import { describe, expect, it } from "vitest";
import { isValidSlug, slugCandidates, slugFromDomain } from "./slug";

describe("slug rules", () => {
  it("accepts 3–40 lowercase letters, numbers and dashes", () => {
    expect(isValidSlug("mysite-com")).toBe(true);
    expect(isValidSlug("abc")).toBe(true);
    expect(isValidSlug("a".repeat(40))).toBe(true);
  });

  it("refuses everything else", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
    expect(isValidSlug("My Site")).toBe(false);
    expect(isValidSlug("-site")).toBe(false);
    expect(isValidSlug("my--site")).toBe(false);
    expect(isValidSlug("admin")).toBe(false);
    expect(isValidSlug("dashboard")).toBe(false);
  });
});

describe("slugFromDomain", () => {
  it("turns the domain into the default address", () => {
    expect(slugFromDomain("mysite.com")).toBe("mysite-com");
    expect(slugFromDomain("xyz.com")).toBe("xyz-com");
    expect(slugFromDomain("simpledash.app")).toBe("simpledash-app");
    expect(slugFromDomain("www.My-Site.co.uk")).toBe("my-site-co-uk");
    expect(slugFromDomain("x.y")).toBe("x-y");
    expect(slugFromDomain("??")).toBe("my-site");
    expect(slugFromDomain("a".repeat(60) + ".com").length).toBeLessThanOrEqual(40);
  });

  it("offers numbered alternatives that stay valid", () => {
    expect(slugCandidates("mysite-com", 3)).toEqual(["mysite-com", "mysite-com-2", "mysite-com-3"]);
    for (const s of slugCandidates("a".repeat(40), 12)) expect(isValidSlug(s)).toBe(true);
  });
});
