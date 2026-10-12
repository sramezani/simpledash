import { describe, expect, it } from "vitest";
import { isValidSlug, slugCandidates, slugFromDomain, slugProblem } from "./slug";

describe("slug rules", () => {
  it("accepts 3–40 lowercase letters, numbers and dashes", () => {
    expect(isValidSlug("mysite-com")).toBe(true);
    expect(isValidSlug("abc")).toBe(true);
    expect(isValidSlug("a".repeat(40))).toBe(true);
  });

  it("refuses everything else, with a plain reason", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(slugProblem("ab")).toBe("Use 3 to 40 characters.");
    expect(isValidSlug("a".repeat(41))).toBe(false);
    expect(slugProblem("My Site")).toBe("Use only lowercase letters, numbers and dashes.");
    expect(slugProblem("-site")).toContain("Dashes");
    expect(slugProblem("my--site")).toContain("Dashes");
    expect(isValidSlug("admin")).toBe(false);
    expect(slugProblem("dashboard")).toBe("That address is reserved. Try another.");
    expect(slugProblem("mysite-com")).toBeNull();
  });
});

describe("slugFromDomain", () => {
  it("turns the domain into the default address", () => {
    expect(slugFromDomain("mysite.com")).toBe("mysite-com");
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
