import { describe, expect, it } from "vitest";
import { actionFacts, searchActionNote, weekStart, weeklyActions } from "./action";
import { pageQueries, slippingQuery, type PageQueries, type Unclicked } from "./insights";

const q = (
  query: string,
  impressions: number,
  position: number,
  positionThen: number | null,
  clicks = 10,
) => ({ query, impressions, position, positionThen, clicks, clicksThen: clicks });

const page = (path: string, clicks: number, queries: ReturnType<typeof q>[]): PageQueries => ({
  page: `https://x.com${path}`,
  path,
  label: path,
  clicks,
  impressions: queries.reduce((a, r) => a + r.impressions, 0),
  queries,
});

const unclicked = (path: string, impressions: number): Unclicked => ({
  page: `https://x.com${path}`,
  label: path,
  impressions,
  clicks: 2,
  rate: 2 / impressions,
  position: 4,
  group: "4–5",
  siteRate: 0.05,
});

describe("weeklyActions", () => {
  const pages = [
    page("/blog/a", 120, [q("ga4 setup", 900, 7.6, 4.2)]), // slipping
    page("/pricing", 80, [q("ga4 dashboard", 940, 11.2, 12.1)]), // close to page 1
    page("/blog/b", 300, [q("seo", 2000, 3, 3)]), // nothing to do
  ];
  const signups = {
    rows: [
      { path: "/blog/a/", signups: 2 },
      { path: "/pricing", signups: 6 },
    ],
    complete: true,
  };

  it("puts pages that bring signups first: slipping, then close to page 1, then seen not clicked", () => {
    const picks = weeklyActions({
      pages,
      unclicked: [unclicked("/docs", 3000), unclicked("/pricing", 900)],
      signups,
      recent: [],
    });
    expect(picks.map((p) => [p.kind, p.path, p.signups])).toEqual([
      ["slipping", "/blog/a", 2],
      ["near", "/pricing", 6],
      ["unclicked", "/docs", 0],
    ]);
    expect(picks[1]!.query?.query).toBe("ga4 dashboard");
  });

  it("ranks by Google numbers when there's no signup event", () => {
    const picks = weeklyActions({ pages, unclicked: [], signups: null, recent: [] });
    expect(picks.map((p) => [p.kind, p.path, p.signups])).toEqual([
      ["slipping", "/blog/a", null],
      ["near", "/pricing", null],
    ]);
  });

  it("skips pages worked on recently, and has nothing when nothing stands out", () => {
    expect(
      weeklyActions({ pages, unclicked: [], signups, recent: ["/blog/a/"] }).map((p) => p.path),
    ).toEqual(["/pricing"]);
    expect(weeklyActions({ pages: [pages[2]!], unclicked: [], signups, recent: [] })).toEqual([]);
  });

  it("needs 100 views for a search close to page 1", () => {
    const quiet = [page("/x", 5, [q("rare", 60, 10, 11)])];
    expect(weeklyActions({ pages: quiet, unclicked: [], signups: null, recent: [] })).toEqual([]);
  });
});

describe("slippingQuery", () => {
  it("needs 2 positions worse and 50 views on the most-seen search", () => {
    expect(slippingQuery(page("/a", 1, [q("s", 50, 6.1, 4.1)]))?.query).toBe("s");
    expect(slippingQuery(page("/a", 1, [q("s", 49, 9, 4)]))).toBeNull();
    expect(slippingQuery(page("/a", 1, [q("s", 500, 5.9, 4)]))).toBeNull();
    expect(slippingQuery(page("/a", 1, [q("s", 500, 9, null)]))).toBeNull();
  });
});

describe("pageQueries", () => {
  it("lists each page's most-seen searches with their numbers the period before", () => {
    const row = (
      query: string,
      url: string,
      clicks: number,
      impressions: number,
      position: number,
    ) => ({
      query,
      page: url,
      clicks,
      impressions,
      position,
    });
    const [first] = pageQueries(
      [{ page: "https://x.com/a/", clicks: 12, impressions: 1000, position: 5 }],
      [row("one", "https://x.com/a/", 2, 100, 9), row("two", "https://x.com/a/", 10, 900, 4)],
      [row("two", "https://x.com/a/", 4, 800, 6)],
      "x.com",
    );
    expect(first!.path).toBe("/a");
    expect(first!.queries.map((r) => [r.query, r.positionThen, r.clicksThen])).toEqual([
      ["two", 6, 4],
      ["one", null, 0],
    ]);
  });
});

describe("weekStart", () => {
  it("is this week's Monday in the site's time zone", () => {
    expect(weekStart("UTC", new Date("2026-10-17T12:00:00Z"))).toBe("2026-10-12");
    expect(weekStart("UTC", new Date("2026-10-12T00:30:00Z"))).toBe("2026-10-12");
    expect(weekStart("Pacific/Auckland", new Date("2026-10-18T12:00:00Z"))).toBe("2026-10-19");
  });
});

describe("searchActionNote", () => {
  it("fits a chart note's 80 characters", () => {
    expect(searchActionNote("/blog/ga4")).toBe("Worked on /blog/ga4");
    const long = searchActionNote(`/${"a".repeat(100)}`);
    expect(long).toHaveLength(80);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("actionFacts", () => {
  it("states the numbers behind each kind of pick", () => {
    const [slip, near, seen] = weeklyActions({
      pages: [
        page("/blog/a", 120, [q("ga4 setup", 900, 7.6, 4.2, 30)]),
        page("/pricing", 1, [q("ga4 dashboard", 940, 11.2, 12.1, 12)]),
      ],
      unclicked: [unclicked("/docs", 3000)],
      signups: { rows: [{ path: "/blog/a", signups: 2 }], complete: true },
      recent: [],
    });
    expect(actionFacts(slip!)).toEqual([
      "Brought 2 signups from Google search in the last 28 days (120 clicks).",
      "“ga4 setup” went from position 4.2 to 7.6; clicks 30 → 30.",
    ]);
    expect(actionFacts(near!)).toEqual([
      "No signups from Google search in the last 28 days; 1 click.",
      "“ga4 dashboard” sits at position 11.2 (page 2), seen 940 times, 12 clicks.",
    ]);
    expect(actionFacts(seen!)[1]).toBe(
      "Seen 3,000 times at position 4 and clicked 0.07% of the time; your pages at about that position get 5.0%.",
    );
  });
});
