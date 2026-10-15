import { describe, expect, it } from "vitest";
import { settingsNavGroups } from "./settings-nav";
import { settingsRoutes } from "./settings-routes";

describe("settingsNavGroups", () => {
  it("lists the account pages, then each site with its own settings page", () => {
    const groups = settingsNavGroups([
      { id: "a1", label: "simpledash.app", domain: "simpledash.app" },
      { id: "b2", label: "meetline.me", domain: "meetline.me" },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Account", "Sites"]);
    expect(groups[0]!.items.map((i) => [i.label, i.href])).toEqual([
      ["Profile", "/settings"],
      ["Plan & billing", "/settings/billing"],
      ["Monday email", "/settings/email"],
    ]);
    expect(groups[1]!.items).toEqual([
      {
        href: "/settings/sites/a1",
        label: "simpledash.app",
        icon: "site",
        domain: "simpledash.app",
      },
      {
        href: "/settings/sites/b2",
        label: "meetline.me",
        icon: "site",
        domain: "meetline.me",
      },
    ]);
  });

  it("says Site for one site, and leaves the group out without any", () => {
    const one = settingsNavGroups([{ id: "a", label: "a.com", domain: null }]);
    expect(one[1]!.label).toBe("Site");
    expect(settingsNavGroups([]).map((g) => g.label)).toEqual(["Account"]);
  });

  it("uses the addresses it's given (the dev preview)", () => {
    const groups = settingsNavGroups([{ id: "a", label: "a.com", domain: null }], {
      account: "/p",
      billing: "/p?b",
      email: "/p?e",
      site: (id) => `/p?site=${id}`,
    });
    expect(groups.flatMap((g) => g.items).map((i) => i.href)).toEqual([
      "/p",
      "/p?b",
      "/p?e",
      "/p?site=a",
    ]);
  });
});

describe("settingsRoutes", () => {
  it("builds a site's address, with an optional section", () => {
    expect(settingsRoutes.site("abc")).toBe("/settings/sites/abc");
    expect(settingsRoutes.site("abc", "search")).toBe("/settings/sites/abc#search");
  });
});
