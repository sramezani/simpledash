import { describe, expect, it } from "vitest";
import {
  latestRequest,
  parseLatest,
  parseSearch,
  searchParamsKey,
  searchRequests,
  type SearchContext,
} from "./reports";
import { searchWindow } from "./window";

const window = searchWindow({ start: "2026-10-06", end: "2026-10-12" }, "2026-10-10");
const ctx: SearchContext = {
  window,
  domain: "example.com",
  pageFilter: null,
  terms: ["example"],
  brand: "(?i)(example)",
};

describe("searchRequests", () => {
  it("asks for both periods, by date for the chart", () => {
    const [current, previous, daily] = searchRequests("search_overview", ctx);
    expect(current).toMatchObject({
      startDate: "2026-10-04",
      endDate: "2026-10-10",
      type: "web",
      dataState: "final",
    });
    expect(previous).toMatchObject({ startDate: "2026-09-27", endDate: "2026-10-03" });
    expect(daily!.dimensions).toEqual(["date"]);
  });

  it("asks for searches by page and pages, as many rows as Google allows", () => {
    const requests = searchRequests("search_insights", ctx);
    expect(requests.map((r) => [r.dimensions, r.rowLimit])).toEqual([
      [["query", "page"], 25_000],
      [["query", "page"], 25_000],
      [["page"], 25_000],
      [["page"], 25_000],
    ]);
  });

  it("splits searches with the site's name from the others with Google's own filters", () => {
    const [brand, other] = searchRequests("search_brand", ctx);
    expect(brand!.dimensionFilterGroups![0]!.filters).toEqual([
      { dimension: "query", operator: "includingRegex", expression: "(?i)(example)" },
    ]);
    expect(other!.dimensionFilterGroups![0]!.filters[0]!.operator).toBe("excludingRegex");
    expect(searchRequests("search_brand", { ...ctx, brand: null })).toEqual([]);
  });

  it("adds the page filter to every request when there is one", () => {
    const filtered = { ...ctx, pageFilter: "^https?://blog\\.example\\.com(/|$)" };
    for (const r of [
      ...searchRequests("search_overview", filtered),
      latestRequest(filtered, new Date("2026-10-13T12:00:00Z")),
    ]) {
      expect(r.dimensionFilterGroups![0]!.filters[0]).toEqual({
        dimension: "page",
        operator: "includingRegex",
        expression: filtered.pageFilter,
      });
    }
  });
});

describe("parseSearch", () => {
  it("fills every day of the chart, and has no position without views", () => {
    const overview = parseSearch(
      "search_overview",
      [
        { rows: [{ clicks: 30, impressions: 900, position: 7.2 }] },
        { rows: [] },
        { rows: [{ keys: ["2026-10-05"], clicks: 30, impressions: 900 }] },
      ],
      ctx,
    );
    expect(overview.current).toEqual({ clicks: 30, impressions: 900, position: 7.2 });
    expect(overview.previous).toEqual({ clicks: 0, impressions: 0, position: null });
    expect(overview.days).toHaveLength(7);
    expect(overview.days[1]).toEqual({ date: "2026-10-05", clicks: 30, impressions: 900 });
    expect(overview.days[0]).toEqual({ date: "2026-10-04", clicks: 0, impressions: 0 });
  });

  it("adds up the name and other searches per day and per period", () => {
    const brand = parseSearch(
      "search_brand",
      [
        {
          rows: [
            { keys: ["2026-10-04"], clicks: 4 },
            { keys: ["2026-10-06"], clicks: 6 },
          ],
        },
        { rows: [{ keys: ["2026-10-04"], clicks: 20 }] },
        { rows: [{ clicks: 8 }] },
        { rows: [{ clicks: 25 }] },
      ],
      ctx,
    );
    expect(brand.current).toEqual({ brand: 10, other: 20 });
    expect(brand.previous).toEqual({ brand: 8, other: 25 });
    expect(brand.days[0]).toEqual({ date: "2026-10-04", brand: 4, other: 20 });
    expect(brand.terms).toEqual(["example"]);
  });
});

describe("newest day and cache keys", () => {
  it("reads Google's newest finished day", () => {
    const now = new Date("2026-10-13T12:00:00Z");
    expect(
      parseLatest({ rows: [{ keys: ["2026-10-09"] }, { keys: ["2026-10-10"] }] }, now),
    ).toEqual({
      day: "2026-10-10",
    });
  });

  it("keys on the property and filter, and the name only for the name view", () => {
    expect(searchParamsKey("search_overview", "sc-domain:example.com", ctx)).toBe(
      "sc=sc-domain:example.com|f=",
    );
    expect(searchParamsKey("search_brand", "sc-domain:example.com", ctx)).toBe(
      "sc=sc-domain:example.com|f=|b=example",
    );
  });
});
