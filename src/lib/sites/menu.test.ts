import { describe, expect, it } from "vitest";
import { filterSiteMenu, siteMenuGroups, type MenuSite } from "./menu";

const site = (id: string, propertyId: string, over: Partial<MenuSite> = {}): MenuSite => ({
  id,
  propertyId,
  label: `${id}.com`,
  domain: `${id}.com`,
  problem: null,
  ...over,
});

const properties = [
  { propertyId: "properties/1", displayName: "Alpha", account: "Studio" },
  { propertyId: "properties/2", displayName: "Beta", account: "Studio" },
  { propertyId: "properties/3", displayName: "Gamma", account: "Client" },
];

describe("siteMenuGroups", () => {
  it("shows only the user's own sites, current first, before Google's list arrives", () => {
    const groups = siteMenuGroups(
      null,
      [site("a", "properties/1"), site("b", "properties/2")],
      "b",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.rows.map((r) => [r.siteId, r.current])).toEqual([
      ["b", true],
      ["a", false],
    ]);
    expect(siteMenuGroups(null, [], "x")).toEqual([]);
  });

  it("lists every Google site by account, with the user's sites linked to their site", () => {
    const groups = siteMenuGroups(properties, [site("b", "properties/2")], "b");
    expect(groups.map((g) => g.account)).toEqual(["Studio", "Client"]);
    const [alpha, beta] = groups[0]!.rows;
    expect(alpha).toMatchObject({ label: "Alpha", siteId: null, current: false });
    expect(beta).toMatchObject({ label: "b.com", siteId: "b", current: true });
    expect(groups[1]!.rows[0]).toMatchObject({ label: "Gamma", account: "Client", siteId: null });
  });

  it("keeps the user's sites that Google no longer lists, with their problem", () => {
    const gone = site("g", "properties/9", {
      problem: "No access to this site in Google Analytics",
    });
    const groups = siteMenuGroups(properties, [gone], "g");
    expect(groups.at(-1)).toEqual({
      account: "",
      rows: [expect.objectContaining({ siteId: "g", current: true, problem: gone.problem })],
    });
  });

  it("lists a property only once, even if Google repeats it", () => {
    const groups = siteMenuGroups([...properties, properties[0]!], [], "x");
    expect(groups.flatMap((g) => g.rows).map((r) => r.propertyId)).toEqual([
      "properties/1",
      "properties/2",
      "properties/3",
    ]);
  });
});

describe("filterSiteMenu", () => {
  const groups = siteMenuGroups(properties, [site("b", "properties/2")], "b");

  it("matches the name, the account, the domain and the property number", () => {
    const names = (q: string) =>
      filterSiteMenu(groups, q)
        .flatMap((g) => g.rows)
        .map((r) => r.label);
    expect(names("alp")).toEqual(["Alpha"]);
    expect(names("CLIENT")).toEqual(["Gamma"]);
    expect(names("b.com")).toEqual(["b.com"]);
    expect(names("3")).toEqual(["Gamma"]);
    expect(names("  ")).toEqual(["Alpha", "b.com", "Gamma"]);
    expect(filterSiteMenu(groups, "nothing")).toEqual([]);
  });
});
