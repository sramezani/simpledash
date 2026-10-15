import { describe, expect, it } from "vitest";
import { chooseSite, readSiteId, siteList, siteProblem } from "./access";

const at = (day: number) => new Date(Date.UTC(2026, 9, day));
const site = (id: string, addedDay: number | null, isActive = false) => ({
  id,
  isActive,
  addedAt: addedDay === null ? null : at(addedDay),
});

describe("siteList", () => {
  it("lists added sites in the order they were added", () => {
    const list = siteList([site("c", 3), site("a", 1, true), site("b", 2), site("x", null)]);
    expect(list.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps an active site that isn't in the list (an old row), first", () => {
    expect(siteList([site("b", 2), site("a", null, true)]).map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("chooseSite", () => {
  const sites = [site("a", 1), site("b", 2, true), site("c", 3), site("old", null)];

  it("shows the active site when the address names none", () => {
    expect(chooseSite(sites, null)?.id).toBe("b");
    expect(chooseSite(sites, undefined)?.id).toBe("b");
  });

  it("opens any listed site named in the address, on every plan", () => {
    expect(chooseSite(sites, "a")?.id).toBe("a");
    expect(chooseSite(sites, "c")?.id).toBe("c");
  });

  it("falls back to the oldest listed site when none is active", () => {
    expect(chooseSite([site("a", 1), site("b", 2)], null)?.id).toBe("a");
  });

  it("treats unknown and unlisted sites as missing", () => {
    expect(chooseSite(sites, "nope")).toBeNull();
    expect(chooseSite(sites, "old")).toBeNull();
    expect(chooseSite([], null)).toBeNull();
  });
});

describe("siteProblem", () => {
  it("says what a site's status means, and nothing when it's fine", () => {
    expect(siteProblem("ok")).toBeNull();
    expect(siteProblem("needs_reconnect")).toBe("Google access ended");
    expect(siteProblem("no_access")).toBe("No access to this site in Google Analytics");
  });
});

describe("readSiteId", () => {
  it("accepts only UUIDs", () => {
    const id = "0f8b9c4e-1d2a-4b3c-9e8f-123456789abc";
    expect(readSiteId(id)).toBe(id);
    expect(readSiteId([id, "x"])).toBe(id);
    expect(readSiteId("properties/123")).toBeNull();
    expect(readSiteId("' or 1=1 --")).toBeNull();
    expect(readSiteId(undefined)).toBeNull();
  });
});
