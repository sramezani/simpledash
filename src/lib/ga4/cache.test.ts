import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Site } from "@/lib/db/schema";
import {
  getReports,
  maxAge,
  warmReports,
  type CacheDeps,
  type CacheKey,
  type CacheRow,
} from "./cache";
import { resetLimiter } from "./limiter";
import { rangeWindow } from "./ranges";

const NOW = new Date("2026-10-11T12:00:00Z");
const HOUR = 3_600_000;
const MINUTE = 60_000;

const site: Site = {
  id: "site_1",
  userId: "user_1",
  propertyId: "properties/1",
  isActive: true,
  displayName: "My site",
  domain: "mysite.com",
  timeZone: "UTC",
  currencyCode: "EUR",
  serviceLevel: "GOOGLE_ANALYTICS_STANDARD",
  propertyCreatedAt: new Date("2024-01-01T00:00:00Z"),
  signupEvent: null,
  status: "ok",
  quotaBlockedUntil: null,
  addedAt: NOW,
  lastViewedAt: null,
  searchConsoleUrl: null,
  brandTerms: [],
  saleEvent: null,
  salePage: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const totalsResponse = {
  dimensionHeaders: [{ name: "dateRange" }],
  metricHeaders: [
    { name: "activeUsers" },
    { name: "screenPageViews" },
    { name: "userEngagementDuration" },
  ],
  rows: [
    {
      dimensionValues: [{ value: "current" }],
      metricValues: [{ value: "10" }, { value: "20" }, { value: "300" }],
    },
  ],
};

function makeDeps() {
  const rows = new Map<string, CacheRow>();
  const leases = new Set<string>();
  const scheduled: (() => Promise<void>)[] = [];
  const key = (k: CacheKey) => `${k.report}|${k.paramsHash}`;
  const deps: CacheDeps & {
    rows: typeof rows;
    scheduled: typeof scheduled;
    leases: typeof leases;
  } = {
    rows,
    scheduled,
    leases,
    store: {
      read: async (_p, _r, keys) =>
        keys.map((k) => rows.get(key(k))).filter((r): r is CacheRow => !!r),
      upsert: async (_p, _r, list) => {
        for (const row of list) rows.set(key(row), row);
      },
      lease: async (_p, _r, keys) => {
        const got = keys.filter((k) => rows.has(key(k)) && !leases.has(key(k)));
        got.forEach((k) => leases.add(key(k)));
        return got;
      },
      setError: vi.fn(async () => {}),
    },
    sites: {
      markNeedsReconnect: vi.fn(async () => {}),
      markNoAccess: vi.fn(async () => {}),
      blockQuota: vi.fn(async () => {}),
    },
    fetchBatch: vi.fn(async (_u: string, _p: string, requests: unknown[]) =>
      requests.map(() => totalsResponse),
    ),
    schedule: (task) => {
      scheduled.push(task);
    },
    logError: vi.fn(),
  };
  return deps;
}

function seed(deps: ReturnType<typeof makeDeps>, overrides: Partial<CacheRow> = {}) {
  deps.rows.set("totals|-", {
    report: "totals",
    paramsHash: "-",
    windowStart: "2026-10-05",
    windowEnd: "2026-10-11",
    payload: {
      current: { visitors: 1, pageViews: 1, engagementSeconds: 1 },
      previous: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
    },
    fetchedAt: new Date(NOW.getTime() - 10 * MINUTE),
    ...overrides,
  });
}

beforeEach(() => resetLimiter());

describe("getReports", () => {
  it("returns a fresh row without calling Google", async () => {
    const deps = makeDeps();
    seed(deps);
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW });
    expect(result.reports.totals.fresh).toBe(true);
    expect(result.reports.totals.data?.current.visitors).toBe(1);
    expect(result.refreshing).toBe(false);
    expect(deps.fetchBatch).not.toHaveBeenCalled();
    expect(deps.scheduled).toHaveLength(0);
  });

  it("shows a stale row at once and refreshes it in the background", async () => {
    const deps = makeDeps();
    seed(deps, { fetchedAt: new Date(NOW.getTime() - 4 * HOUR) });
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW });
    expect(result.reports.totals.data?.current.visitors).toBe(1);
    expect(result.reports.totals.fresh).toBe(false);
    expect(result.refreshing).toBe(true);
    expect(deps.fetchBatch).not.toHaveBeenCalled();

    await deps.scheduled[0]!();
    expect(deps.fetchBatch).toHaveBeenCalledTimes(1);
    expect(
      (deps.rows.get("totals|-")?.payload as { current: { visitors: number } }).current.visitors,
    ).toBe(10);
  });

  it("treats yesterday's window as stale after the day turns", async () => {
    const deps = makeDeps();
    seed(deps, {
      windowStart: "2026-10-04",
      windowEnd: "2026-10-10",
      fetchedAt: new Date(NOW.getTime() - 60_000),
    });
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW });
    expect(result.reports.totals.fresh).toBe(false);
    expect(result.refreshing).toBe(true);
  });

  it("fetches a missing report right away", async () => {
    const deps = makeDeps();
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW });
    expect(deps.fetchBatch).toHaveBeenCalledTimes(1);
    expect(result.reports.totals.data?.current.visitors).toBe(10);
    expect(result.reports.totals.fresh).toBe(true);
    expect(deps.rows.get("totals|-")?.windowEnd).toBe("2026-10-11");
  });

  it("batches at most 5 reports per call", async () => {
    const deps = makeDeps();
    await getReports(
      site,
      "7d",
      ["totals", "series", "sources", "channels", "pages", "landing", "countries"],
      deps,
      { now: NOW },
    );
    const calls = vi.mocked(deps.fetchBatch).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls.map((c) => c[2].length).sort()).toEqual([2, 5]);
  });

  it("keeps the batches that arrived when another batch fails", async () => {
    const deps = makeDeps();
    let call = 0;
    deps.fetchBatch = vi.fn(async (_u: string, _p: string, requests: unknown[]) => {
      call++;
      if (call === 2) throw Object.assign(new Error("bad"), { code: 3, httpStatusCode: 400 });
      return requests.map(() => totalsResponse);
    });
    const result = await getReports(
      site,
      "7d",
      ["totals", "series", "sources", "channels", "pages", "landing", "countries"],
      deps,
      { now: NOW },
    );
    expect(result.problem).toBe("bad_request");
    expect(deps.rows.size).toBe(5);
    expect(result.reports.totals.data).not.toBeNull();
    expect(result.reports.countries.data).toBeNull();
  });

  it("skips the background refresh when another one holds the lease", async () => {
    const deps = makeDeps();
    seed(deps, { fetchedAt: new Date(NOW.getTime() - 4 * HOUR) });
    deps.leases.add("totals|-");
    await getReports(site, "7d", ["totals"], deps, { now: NOW });
    await deps.scheduled[0]!();
    expect(deps.fetchBatch).not.toHaveBeenCalled();
  });

  it("doesn't call Google when access was revoked, but still shows cached numbers", async () => {
    const deps = makeDeps();
    seed(deps, { fetchedAt: new Date(NOW.getTime() - 10 * HOUR) });
    const result = await getReports(
      { ...site, status: "needs_reconnect" },
      "7d",
      ["totals", "pages"],
      deps,
      {
        now: NOW,
      },
    );
    expect(result.problem).toBe("revoked");
    expect(result.reports.totals.data).not.toBeNull();
    expect(result.reports.pages.data).toBeNull();
    expect(result.refreshing).toBe(false);
    expect(deps.fetchBatch).not.toHaveBeenCalled();
  });

  it("respects a quota block", async () => {
    const until = new Date(NOW.getTime() + HOUR);
    const deps = makeDeps();
    const result = await getReports({ ...site, quotaBlockedUntil: until }, "7d", ["totals"], deps, {
      now: NOW,
    });
    expect(result.problem).toBe("quota");
    expect(result.quotaUntil).toEqual(until);
    expect(deps.fetchBatch).not.toHaveBeenCalled();
  });

  it("blocks the site until the next hour when Google says 429", async () => {
    const deps = makeDeps();
    deps.fetchBatch = vi.fn(async () => {
      throw Object.assign(new Error("Exhausted property tokens per hour"), {
        code: 8,
        httpStatusCode: 429,
      });
    });
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW });
    expect(result.problem).toBe("quota");
    expect(result.quotaUntil?.toISOString()).toBe("2026-10-11T13:00:00.000Z");
    expect(deps.sites.blockQuota).toHaveBeenCalledWith("site_1", result.quotaUntil);
  });

  it("marks the user's sites for reconnect on 401", async () => {
    const deps = makeDeps();
    deps.fetchBatch = vi.fn(async () => {
      throw Object.assign(new Error("unauthenticated"), { code: 16, httpStatusCode: 401 });
    });
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW });
    expect(result.problem).toBe("revoked");
    expect(deps.sites.markNeedsReconnect).toHaveBeenCalledWith("user_1");
  });

  it("marks lost access on 403", async () => {
    const deps = makeDeps();
    deps.fetchBatch = vi.fn(async () => {
      throw Object.assign(new Error("denied"), { code: 7, httpStatusCode: 403 });
    });
    expect((await getReports(site, "7d", ["totals"], deps, { now: NOW })).problem).toBe(
      "no_access",
    );
    expect(deps.sites.markNoAccess).toHaveBeenCalledWith("site_1");
  });

  it("records the error on the rows when a background refresh fails", async () => {
    const deps = makeDeps();
    seed(deps, { fetchedAt: new Date(NOW.getTime() - 4 * HOUR) });
    deps.fetchBatch = vi.fn(async () => {
      throw Object.assign(new Error("backend error"), { code: 14, httpStatusCode: 503 });
    });
    await getReports(site, "7d", ["totals"], deps, { now: NOW });
    await deps.scheduled[0]!();
    expect(deps.store.setError).toHaveBeenCalled();
    expect(deps.logError).toHaveBeenCalled();
  });

  it("keys Actions on the chosen signup event", async () => {
    const deps = makeDeps();
    await getReports({ ...site, signupEvent: "sign_up" }, "7d", ["actions"], deps, { now: NOW });
    expect([...deps.rows.keys()]).toEqual(["actions|signup=sign_up"]);
  });
});

describe("cache only (no Google calls)", () => {
  it("returns what's cached and never calls Google", async () => {
    const deps = makeDeps();
    seed(deps, { fetchedAt: new Date(NOW.getTime() - 30 * HOUR) });
    const result = await getReports(site, "7d", ["totals", "pages"], deps, {
      now: NOW,
      cacheOnly: true,
    });
    expect(result.reports.totals.data).not.toBeNull();
    expect(result.reports.pages.data).toBeNull();
    expect(result.refreshing).toBe(false);
    expect(deps.fetchBatch).not.toHaveBeenCalled();
    expect(deps.scheduled).toHaveLength(0);
  });
});

describe("freshness", () => {
  it("is half an hour for ranges that end today (an hour on public pages), longer for past ones", () => {
    const now = new Date("2026-10-11T12:00:00Z");
    const w = (range: Parameters<typeof rangeWindow>[0]) => rangeWindow(range, "UTC", now);
    // Every preset but Yesterday includes today, which keeps changing.
    for (const range of ["today", "7d", "30d", "12m"] as const) {
      expect(maxAge(w(range), "owner")).toBe(HOUR / 2);
      expect(maxAge(w(range), "public")).toBe(HOUR);
    }
    expect(maxAge(w("yesterday"), "owner")).toBe(3 * HOUR);
    // Custom: a finished past period won't change; one that ends today keeps changing.
    expect(maxAge(w("2026-09-01..2026-09-30"), "owner")).toBe(24 * HOUR);
    expect(maxAge(w("2026-10-01..2026-10-10"), "owner")).toBe(3 * HOUR);
    expect(maxAge(w("2026-10-01..2026-10-11"), "owner")).toBe(HOUR / 2);
  });

  it("lets a public page use a row a dashboard would refresh", async () => {
    const deps = makeDeps();
    seed(deps, { fetchedAt: new Date(NOW.getTime() - 45 * MINUTE) });
    const result = await getReports(site, "7d", ["totals"], deps, { now: NOW, audience: "public" });
    expect(result.reports.totals.fresh).toBe(true);
  });
});

describe("warmReports", () => {
  it("fetches only stale or missing reports", async () => {
    const deps = makeDeps();
    seed(deps);
    expect(await warmReports(deps, site, "7d", ["totals"], NOW)).toBe("fresh");
    expect(await warmReports(deps, site, "7d", ["totals", "pages"], NOW)).toBe("warmed");
    expect(vi.mocked(deps.fetchBatch).mock.calls[0]![2]).toHaveLength(1);
  });

  it("skips sites that can't be fetched", async () => {
    const deps = makeDeps();
    expect(await warmReports(deps, { ...site, status: "no_access" }, "7d", ["totals"], NOW)).toBe(
      "no_access",
    );
    expect(deps.fetchBatch).not.toHaveBeenCalled();
  });
});
