import { describe, expect, it } from "vitest";
import { canAddSite, chooseSite, openableSites, readSiteId, siteList } from "./access";

const at = (day: number) => new Date(Date.UTC(2026, 9, day));
const site = (id: string, addedDay: number | null, isActive = false) => ({
  id,
  isActive,
  addedAt: addedDay === null ? null : at(addedDay),
});

const pro = { sites: 10 };
const free = { sites: 1 };

describe("siteList", () => {
  it("lists added sites in the order they were added", () => {
    const list = siteList([site("c", 3), site("a", 1, true), site("b", 2), site("x", null)]);
    expect(list.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps an active site that isn't in the list (an old row), first", () => {
    expect(siteList([site("b", 2), site("a", null, true)]).map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("openableSites", () => {
  const sites = [site("a", 1), site("b", 2, true), site("c", 3)];

  it("opens every added site on Pro", () => {
    expect(openableSites(sites, pro).map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("opens only the active site on Free, keeping the others paused", () => {
    expect(openableSites(sites, free).map((s) => s.id)).toEqual(["b"]);
  });

  it("never opens more than the limit, oldest first", () => {
    expect(openableSites(sites, { sites: 2 }).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("opens nothing without sites", () => {
    expect(openableSites([], pro)).toEqual([]);
  });
});

describe("chooseSite", () => {
  const sites = [site("a", 1), site("b", 2, true), site("c", 3), site("old", null)];

  it("shows the active site when the address names none", () => {
    expect(chooseSite(sites, pro, null)).toMatchObject({ kind: "open", site: { id: "b" } });
    expect(chooseSite(sites, free, undefined)).toMatchObject({
      kind: "open",
      site: { id: "b" },
    });
  });

  it("opens a named site on Pro", () => {
    expect(chooseSite(sites, pro, "c")).toMatchObject({ kind: "open", site: { id: "c" } });
  });

  it("asks a Free user to upgrade for a listed site that isn't the active one", () => {
    expect(chooseSite(sites, free, "c")).toMatchObject({ kind: "upgrade", site: { id: "c" } });
  });

  it("treats unknown and unlisted sites as missing", () => {
    expect(chooseSite(sites, pro, "nope")).toEqual({ kind: "missing" });
    expect(chooseSite(sites, pro, "old")).toEqual({ kind: "missing" });
    expect(chooseSite([], pro, null)).toEqual({ kind: "missing" });
  });
});

describe("canAddSite", () => {
  it("lets Pro add sites up to the limit", () => {
    expect(canAddSite([site("a", 1)], pro)).toBe(true);
    const ten = Array.from({ length: 10 }, (_, i) => site(`s${i}`, i + 1));
    expect(canAddSite(ten, pro)).toBe(false);
    // Rows that left the list don't count.
    expect(canAddSite([...ten.slice(0, 9), site("gone", null)], pro)).toBe(true);
  });

  it("never lets Free add a second site", () => {
    expect(canAddSite([site("a", 1)], free)).toBe(false);
    expect(canAddSite([], free)).toBe(false);
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
