import { describe, expect, it } from "vitest";
import { propertyNumber, siteDetail, siteName } from "./label";

describe("site labels", () => {
  const site = { displayName: "Felinquent", domain: "me.github.io", propertyId: "properties/42" };

  it("names a site by its Google Analytics name", () => {
    expect(siteName(site)).toBe("Felinquent");
    expect(siteName({ ...site, displayName: " " })).toBe("me.github.io");
    expect(siteName({ ...site, displayName: "", domain: null })).toBe("42");
  });

  it("puts the address and property number on the smaller line", () => {
    expect(siteDetail(site)).toBe("me.github.io · ID 42");
    expect(siteDetail({ ...site, domain: null })).toBe("ID 42");
    expect(propertyNumber("properties/123456")).toBe("123456");
  });
});
