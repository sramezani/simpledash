import { describe, expect, it } from "vitest";
import { hostFilter, matchProperty, propertyLabel, verifiedSites } from "./match";

const owner = (siteUrl: string) => ({ siteUrl, permissionLevel: "siteOwner" });

describe("matchProperty", () => {
  it("prefers the site's own domain property", () => {
    const entries = [owner("https://example.com/"), owner("sc-domain:example.com")];
    expect(matchProperty("example.com", entries)).toBe("sc-domain:example.com");
  });

  it("then a URL property: https before http, without www before with", () => {
    expect(
      matchProperty("example.com", [
        owner("http://example.com/"),
        owner("https://www.example.com/"),
      ]),
    ).toBe("https://www.example.com/");
    expect(matchProperty("www.example.com", [owner("https://example.com/")])).toBe(
      "https://example.com/",
    );
  });

  it("uses a parent domain property for a subdomain, the closest parent first", () => {
    const entries = [owner("sc-domain:example.com"), owner("sc-domain:eu.example.com")];
    expect(matchProperty("shop.eu.example.com", entries)).toBe("sc-domain:eu.example.com");
    expect(matchProperty("blog.example.com", entries)).toBe("sc-domain:example.com");
  });

  it("never picks another site, or a property the user can't read", () => {
    expect(matchProperty("example.com", [owner("sc-domain:example.org")])).toBeNull();
    expect(matchProperty("notexample.com", [owner("sc-domain:example.com")])).toBeNull();
    expect(
      matchProperty("example.com", [
        { siteUrl: "sc-domain:example.com", permissionLevel: "siteUnverifiedUser" },
      ]),
    ).toBeNull();
    expect(matchProperty(null, [owner("sc-domain:example.com")])).toBeNull();
  });
});

describe("verifiedSites", () => {
  it("drops unverified properties", () => {
    expect(
      verifiedSites([
        owner("a"),
        { siteUrl: "b", permissionLevel: "siteFullUser" },
        { siteUrl: "c", permissionLevel: "siteUnverifiedUser" },
      ]).map((s) => s.siteUrl),
    ).toEqual(["a", "b"]);
  });
});

describe("hostFilter", () => {
  it("keeps a subdomain's numbers to its own pages under a parent domain property", () => {
    const filter = hostFilter("sc-domain:example.com", "blog.example.com")!;
    const re = new RegExp(filter);
    expect(re.test("https://blog.example.com/post")).toBe(true);
    expect(re.test("https://www.blog.example.com/")).toBe(true);
    expect(re.test("https://blog.example.com")).toBe(true);
    expect(re.test("https://example.com/blog")).toBe(false);
    expect(re.test("https://blog.example.com.evil.test/")).toBe(false);
  });

  it("needs no filter for the site's own property", () => {
    expect(hostFilter("sc-domain:example.com", "example.com")).toBeNull();
    expect(hostFilter("sc-domain:example.com", "www.example.com")).toBeNull();
    expect(hostFilter("https://example.com/", "example.com")).toBeNull();
  });
});

describe("propertyLabel", () => {
  it("says what kind of property it is", () => {
    expect(propertyLabel("sc-domain:example.com")).toBe("Domain example.com");
    expect(propertyLabel("https://example.com/")).toBe("https://example.com/");
  });
});
