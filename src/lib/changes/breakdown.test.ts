import { describe, expect, it } from "vitest";
import type { ChangedPage } from "@/lib/search-console/insights";
import {
  changeBreakdown,
  googleDetail,
  metricChanges,
  MIN_CHANGE,
  sumBySource,
} from "./breakdown";

const cell = (source: string, path: string, then: number, now: number) => ({
  source,
  path,
  then,
  now,
});

describe("changeBreakdown", () => {
  it("ranks sources by how much they moved, with the pages that moved the same way", () => {
    const result = changeBreakdown({
      total: { then: 1284, now: 1696 },
      sources: [
        { source: "google", then: 120, now: 420 },
        { source: "t.co", then: 210, now: 130 },
        { source: "reddit.com", then: 0, now: 64 },
        { source: "bing", then: 10, now: 11 },
      ],
      pages: [
        cell("google", "/blog/ga4", 10, 260),
        cell("google", "/pricing", 30, 70),
        cell("google", "/", 80, 78),
        cell("t.co", "/", 200, 120),
      ],
      min: MIN_CHANGE.visitors,
    });
    expect(result.change).toBe(32);
    expect(result.steady).toBe(false);
    expect(result.movers.map((m) => [m.label, m.delta])).toEqual([
      ["Google", 300],
      ["t.co", -80],
      ["reddit.com", 64],
    ]);
    expect(result.movers[0]!.pages.map((p) => [p.key, p.delta])).toEqual([
      ["/blog/ga4", 250],
      ["/pricing", 40],
    ]);
    expect(result.movers[1]!.pages.map((p) => p.key)).toEqual(["/"]);
    expect(result.all.map((s) => s.key)).not.toContain("bing");
  });

  it("shows moves underneath a steady total", () => {
    const result = changeBreakdown({
      total: { then: 1000, now: 1010 },
      sources: [
        { source: "google", then: 300, now: 420 },
        { source: "t.co", then: 300, now: 185 },
      ],
      pages: [],
      min: 3,
    });
    expect(result.steady).toBe(true);
    expect(result.movers.map((m) => m.delta)).toEqual([120, -115]);
  });

  it("has no % change when there was nothing before, and no total when it isn't known", () => {
    expect(changeBreakdown({ total: { then: 0, now: 5 }, sources: [], pages: [], min: 2 })).toEqual(
      { total: { then: 0, now: 5 }, change: null, steady: false, movers: [], all: [] },
    );
    expect(changeBreakdown({ total: null, sources: [], pages: [], min: 2 }).change).toBeNull();
  });

  it("adds event counts up by source", () => {
    expect(sumBySource([cell("google", "/a", 1, 4), cell("google", "/b", 2, 3)])).toEqual([
      { source: "google", then: 3, now: 7 },
    ]);
  });
});

describe("googleDetail", () => {
  const page = (url: string, clicksThen: number, clicksNow: number): ChangedPage => ({
    page: url,
    label: url,
    clicksThen,
    clicksNow,
    positionThen: 9.2,
    positionNow: 4.1,
    queries: [],
  });

  it("finds the first landing page whose Google clicks moved the same way", () => {
    const changed = {
      rising: [page("https://x.com/pricing", 1, 9), page("https://x.com/blog/ga4/", 12, 48)],
      falling: [page("https://x.com/", 40, 10)],
    };
    const pages = [
      { key: "/blog/ga4", label: "/blog/ga4", then: 10, now: 260, delta: 250 },
      { key: "/pricing", label: "/pricing", then: 30, now: 70, delta: 40 },
    ];
    expect(googleDetail(pages, changed, true)?.page).toBe("https://x.com/blog/ga4/");
    expect(googleDetail(pages, changed, false)).toBeNull();
  });
});

describe("metricChanges", () => {
  const reports = {
    totals: { current: { visitors: 120 }, previous: { visitors: 100 } },
    sources: { rows: [{ source: "google", visitors: 80, previous: 50 }] },
    actions: { current: { sign_up: 9 }, previous: { sign_up: 4 } },
    paths: { rows: [cell("google", "/blog/ga4", 10, 40)] },
    goals: {
      rows: [
        {
          source: "google",
          path: "/blog/ga4",
          now: { sign_up: 6, purchase: 3 },
          then: { sign_up: 1, purchase: 0 },
        },
      ],
      complete: true,
    },
    salePageCells: null,
  };
  const options = { signupEvent: "sign_up", saleEvent: "purchase", salePage: null, search: null };

  it("shows Visitors only on Free", () => {
    expect(metricChanges(reports, { ...options, pro: false }).map((m) => m.id)).toEqual([
      "visitors",
    ]);
  });

  it("adds Signups (total from Actions) and Sales on Pro", () => {
    const [visitors, signups, sales] = metricChanges(reports, { ...options, pro: true });
    expect(visitors!.breakdown.movers[0]!.pages[0]!.key).toBe("/blog/ga4");
    expect(signups!.breakdown.total).toEqual({ now: 9, then: 4 });
    expect(signups!.breakdown.movers[0]!.delta).toBe(5);
    expect(sales!.breakdown.total).toEqual({ now: 3, then: 0 });
  });

  it("leaves the sales total out when GA4 cut the list off", () => {
    const cut = { ...reports, goals: { ...reports.goals, complete: false } };
    const sales = metricChanges(cut, { ...options, pro: true }).find((m) => m.id === "sales");
    expect(sales!.breakdown.total).toBeNull();
  });
});
