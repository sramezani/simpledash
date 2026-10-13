import { describe, expect, it } from "vitest";
import {
  nearPageOne,
  pageLabel,
  pagePath,
  positionGroup,
  searchesToSignups,
  seenNotClicked,
  whatChanged,
  type PageRow,
  type QueryPageRow,
} from "./insights";

const U = "https://example.com";
const qp = (query: string, page: string, clicks: number, impressions: number, position: number) =>
  ({ query, page: `${U}${page}`, clicks, impressions, position }) satisfies QueryPageRow;
const pg = (page: string, clicks: number, impressions: number, position: number) =>
  ({ page: `${U}${page}`, clicks, impressions, position }) satisfies PageRow;

describe("pages", () => {
  it("joins on the path without the query or a trailing slash", () => {
    expect(pagePath("https://example.com/pricing/")).toBe("/pricing");
    expect(pagePath("https://example.com/?ref=x")).toBe("/");
    expect(pagePath("https://example.com/caf%C3%A9")).toBe("/café");
  });

  it("shows the host only for pages on another host", () => {
    expect(pageLabel("https://www.example.com/pricing", "example.com")).toBe("/pricing");
    expect(pageLabel("https://blog.example.com/post", "example.com")).toBe("blog.example.com/post");
    expect(pageLabel("https://blog.example.com/", "example.com")).toBe("blog.example.com");
  });
});

describe("nearPageOne", () => {
  const rows = [
    qp("ga4 dashboard", "/pricing", 14, 3200, 11.2),
    qp("simple analytics", "/pricing", 2, 900, 8.4),
    qp("ga4 alternative", "/blog/ga4", 30, 1500, 9.6),
    qp("top result", "/", 400, 5000, 1.2), // on page 1 already
    qp("far away", "/blog/ga4", 0, 4000, 15.6), // rounds to 16
    qp("just in", "/docs", 0, 100, 7.5), // rounds to 8
  ];

  it("keeps searches whose position rounds to 8–15, most seen first", () => {
    const { all, count } = nearPageOne(rows, "example.com");
    expect(all.map((r) => r.query)).toEqual([
      "ga4 dashboard",
      "ga4 alternative",
      "simple analytics",
      "just in",
    ]);
    expect(count).toBe(4);
  });

  it("groups them by page, the page seen most first", () => {
    const { groups } = nearPageOne(rows, "example.com");
    expect(groups.map((g) => [g.label, g.impressions, g.queries.map((q) => q.query)])).toEqual([
      ["/pricing", 4100, ["ga4 dashboard", "simple analytics"]],
      ["/blog/ga4", 1500, ["ga4 alternative"]],
      ["/docs", 100, ["just in"]],
    ]);
  });

  it("caps the lists", () => {
    const many = Array.from({ length: 30 }, (_, i) => qp(`q${i}`, `/p${i % 3}`, 0, 100 + i, 10));
    const { groups, all } = nearPageOne(many, null, { groups: 2, perGroup: 4, all: 5 });
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.queries.length === 4)).toBe(true);
    expect(all).toHaveLength(5);
  });
});

describe("whatChanged", () => {
  const pagesNow = [pg("/a", 120, 4000, 3.1), pg("/b", 10, 900, 9), pg("/c", 51, 800, 4), pg("/new", 8, 90, 6)];
  const pagesThen = [pg("/a", 45, 3000, 6.5), pg("/b", 40, 1000, 5), pg("/c", 50, 800, 4), pg("/gone", 20, 300, 2)];
  const queriesNow = [
    qp("alpha", "/a", 80, 1000, 2.1),
    qp("beta", "/a", 30, 2000, 4),
    qp("gamma", "/a", 2, 100, 8),
    qp("delta", "/b", 5, 300, 9.5),
  ];
  const queriesThen = [
    qp("alpha", "/a", 20, 900, 6),
    qp("beta", "/a", 20, 1500, 5),
    qp("gamma", "/a", 5, 100, 7),
    qp("delta", "/b", 30, 400, 4.2),
    qp("epsilon", "/b", 5, 50, 3),
  ];

  it("lists the biggest rises and falls, ignoring changes under 3 clicks", () => {
    const { rising, falling } = whatChanged(pagesNow, pagesThen, queriesNow, queriesThen, "example.com");
    expect(rising.map((p) => [p.label, p.clicksThen, p.clicksNow])).toEqual([
      ["/a", 45, 120],
      ["/new", 0, 8],
    ]);
    expect(falling.map((p) => [p.label, p.clicksThen, p.clicksNow])).toEqual([
      ["/b", 40, 10],
      ["/gone", 20, 0],
    ]);
  });

  it("shows the searches behind each change, then and now", () => {
    const { rising, falling } = whatChanged(pagesNow, pagesThen, queriesNow, queriesThen, null);
    expect(rising[0]!.queries.map((q) => q.query)).toEqual(["alpha", "beta"]);
    expect(rising[0]!.queries[0]).toEqual({
      query: "alpha",
      clicksNow: 80,
      clicksThen: 20,
      positionNow: 2.1,
      positionThen: 6,
    });
    // A search that no longer showed the page has no position now.
    expect(falling[0]!.queries).toEqual([
      { query: "delta", clicksNow: 5, clicksThen: 30, positionNow: 9.5, positionThen: 4.2 },
      { query: "epsilon", clicksNow: 0, clicksThen: 5, positionNow: null, positionThen: 3 },
    ]);
    expect(rising[0]!.positionThen).toBe(6.5);
    expect(rising.find((p) => p.label === "/new")!.positionThen).toBeNull();
  });
});

describe("seenNotClicked", () => {
  // Position 4–5: three pages, 2,000 views, 60 clicks → the site gets 3% there.
  const pages = [
    pg("/good", 40, 1000, 4.2),
    pg("/fine", 18, 600, 4.6),
    pg("/low", 2, 400, 4.9), // 0.5%: under half of 3%
    pg("/top", 300, 1000, 1), // position 1: too few pages to compare
    pg("/tiny", 0, 50, 4.4), // too few views to list
  ];

  it("lists pages under half of the site's own rate at about the same position", () => {
    const { pages: flagged, groups } = seenNotClicked(pages, "example.com");
    expect(groups["4–5"]).toBeCloseTo(60 / 2050);
    expect(groups["1"]).toBeUndefined();
    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toMatchObject({ label: "/low", impressions: 400, clicks: 2, group: "4–5" });
    expect(flagged[0]!.rate).toBeCloseTo(0.005);
  });

  it("puts positions in groups", () => {
    expect([1, 2.4, 3, 4.6, 7, 12, 30].map(positionGroup)).toEqual([
      "1",
      "2",
      "3",
      "4–5",
      "6–10",
      "11–20",
      "21+",
    ]);
  });
});

describe("searchesToSignups", () => {
  const pages = [
    { page: `${U}/pricing/`, clicks: 120 },
    { page: `${U}/blog/ga4`, clicks: 300 },
    { page: `${U}/docs`, clicks: 40 },
    { page: `${U}/old`, clicks: 0 },
  ];
  const landing = {
    rows: [
      { path: "/pricing", visitors: 100 },
      { path: "/blog/ga4/", visitors: 260 },
    ],
    complete: true,
  };
  const signups = { rows: [{ path: "/pricing", signups: 9 }], complete: true };

  it("joins Google clicks with visitors and signups from Google search, by path", () => {
    expect(searchesToSignups(pages, landing, signups)).toEqual([
      { path: "/pricing", clicks: 120, visitors: 100, signups: 9 },
      { path: "/blog/ga4", clicks: 300, visitors: 260, signups: 0 },
      { path: "/docs", clicks: 40, visitors: 0, signups: 0 },
    ]);
  });

  it("says unknown, not zero, when GA4's list was cut off or there's no signup event", () => {
    const rows = searchesToSignups(pages, { ...landing, complete: false }, null);
    expect(rows.find((r) => r.path === "/docs")).toEqual({
      path: "/docs",
      clicks: 40,
      visitors: null,
      signups: null,
    });
  });
});
