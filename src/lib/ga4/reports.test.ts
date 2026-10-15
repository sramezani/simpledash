import { describe, expect, it } from "vitest";
import { rangeWindow } from "./ranges";
import { buildRequest, paramsKey, parseReport, readRows, REPORTS } from "./reports";

const window = rangeWindow("7d", "UTC", new Date("2026-10-11T12:00:00Z"));
const params = { signupEvent: "sign_up" };

/** A GA4 response in the REST shape: headers plus string values. */
function response(dims: string[], metrics: string[], rows: (string | number)[][]) {
  return {
    dimensionHeaders: dims.map((name) => ({ name })),
    metricHeaders: metrics.map((name) => ({ name })),
    rows: rows.map((values) => ({
      dimensionValues: values.slice(0, dims.length).map((v) => ({ value: String(v) })),
      metricValues: values.slice(dims.length).map((v) => ({ value: String(v) })),
    })),
  };
}

describe("buildRequest", () => {
  it("builds a request for every report", () => {
    for (const report of REPORTS) {
      const req = buildRequest(report, window, params);
      expect(req.dateRanges?.[0]).toEqual({
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        name: "current",
      });
      expect(req.metrics?.length).toBeGreaterThan(0);
    }
  });

  it("asks for both periods where the card compares", () => {
    expect(buildRequest("totals", window, params).dateRanges).toHaveLength(2);
    expect(buildRequest("sources", window, params).dateRanges).toHaveLength(2);
    expect(buildRequest("actions", window, params).dateRanges).toHaveLength(2);
    expect(buildRequest("pages", window, params).dateRanges).toHaveLength(1);
    expect(buildRequest("totals", window, params).dateRanges?.[1]).toEqual({
      startDate: "2026-09-28",
      endDate: "2026-10-04",
      name: "previous",
    });
  });

  it("uses the chart detail of the range", () => {
    expect(buildRequest("series", window, params).dimensions).toEqual([{ name: "date" }]);
    const monthly = rangeWindow("12m", "UTC", new Date("2026-10-11T12:00:00Z"));
    expect(buildRequest("series", monthly, params).dimensions).toEqual([{ name: "yearMonth" }]);
  });

  it("counts the chosen signup event in Actions, using eventCount (not keyEvents)", () => {
    const req = buildRequest("actions", window, params);
    expect(req.metrics).toEqual([{ name: "eventCount" }]);
    expect(req.dimensionFilter?.filter?.inListFilter?.values).toEqual([
      "file_download",
      "click",
      "form_submit",
      "sign_up",
    ]);
    const without = buildRequest("actions", window, { signupEvent: null });
    expect(without.dimensionFilter?.filter?.inListFilter?.values).toHaveLength(3);
  });

  it("filters AI traffic by channel OR the domain list", () => {
    const req = buildRequest("ai_sources", window, params);
    const group = req.dimensionFilter?.orGroup?.expressions ?? [];
    expect(group[0]?.filter?.stringFilter?.value).toBe("AI Assistant");
    expect(group[1]?.filter?.inListFilter?.values).toContain("claude.ai");
  });

  it("keys the cache on the inputs that change a report", () => {
    expect(paramsKey("actions", { signupEvent: "sign_up" })).toBe("signup=sign_up");
    expect(paramsKey("actions", { signupEvent: null })).toBe("signup=");
    expect(paramsKey("ai_sources", params)).toBe("ai=v1");
    expect(paramsKey("totals", params)).toBe("-");
  });
});

describe("parseReport", () => {
  it("splits totals by period", () => {
    const res = response(
      ["dateRange"],
      ["activeUsers", "screenPageViews", "userEngagementDuration"],
      [
        ["current", 120, 300, 6000],
        ["previous", 100, 250, 5000],
      ],
    );
    expect(parseReport("totals", res, window)).toEqual({
      current: { visitors: 120, pageViews: 300, engagementSeconds: 6000 },
      previous: { visitors: 100, pageViews: 250, engagementSeconds: 5000 },
    });
  });

  it("gives zero totals when GA4 returns no rows", () => {
    expect(parseReport("totals", { rows: [] }, window).previous.visitors).toBe(0);
  });

  it("fills every day of the series, including empty ones", () => {
    const res = response(
      ["date"],
      ["activeUsers"],
      [
        ["20261005", 5],
        ["20261011", 2],
      ],
    );
    const { points } = parseReport("series", res, window);
    expect(points).toHaveLength(7);
    expect(points[0]).toEqual({ key: "20261005", visitors: 5 });
    expect(points[1]).toEqual({ key: "20261006", visitors: 0 });
    expect(points.at(-1)).toEqual({ key: "20261011", visitors: 2 });
  });

  it("leaves today off a daily chart until Google has reported it", () => {
    const res = response(["date"], ["activeUsers"], [["20261010", 4]]);
    const { points } = parseReport("series", res, window);
    expect(points).toHaveLength(6);
    expect(points.at(-1)).toEqual({ key: "20261010", visitors: 4 });
  });

  it("leaves off today's latest hours that Google hasn't reported yet", () => {
    const today = rangeWindow("today", "UTC", new Date("2026-10-11T14:30:00Z"));
    const res = response(
      ["dateHour"],
      ["activeUsers"],
      [
        ["2026101108", 3],
        ["2026101111", 4],
      ],
    );
    const { points, granularity } = parseReport("series", res, today);
    expect(granularity).toBe("dateHour");
    expect(points.map((p) => p.key)).toEqual(
      Array.from({ length: 12 }, (_, h) => `20261011${String(h).padStart(2, "0")}`),
    );
    expect(points[9]).toEqual({ key: "2026101109", visitors: 0 });
    expect(parseReport("series", { rows: [] }, today).points).toEqual([]);
  });

  it("asks GA4 for hours on today and yesterday", () => {
    const today = rangeWindow("today", "UTC", new Date("2026-10-11T14:30:00Z"));
    expect(buildRequest("series", today, { signupEvent: null }).dimensions).toEqual([
      { name: "dateHour" },
    ]);
  });

  it("merges browsers and systems that read the same, in plain words", () => {
    const browsers = parseReport(
      "browsers",
      response(
        ["browser"],
        ["activeUsers"],
        [
          ["Chrome", 50],
          ["Safari (in-app)", 7],
          ["(not set)", 2],
          ["Mozilla Compatible Agent", 1],
        ],
      ),
      window,
    );
    expect(browsers.rows).toEqual([
      { browser: "Chrome", label: "Chrome", visitors: 50 },
      { browser: "Safari (in-app)", label: "Safari (in an app)", visitors: 7 },
      { browser: "(not set)", label: "Unknown", visitors: 2 },
      { browser: "Mozilla Compatible Agent", label: "Other", visitors: 1 },
    ]);
    const systems = parseReport(
      "systems",
      response(
        ["operatingSystem"],
        ["activeUsers"],
        [
          ["Macintosh", 9],
          ["Windows", 12],
        ],
      ),
      window,
    );
    expect(systems.rows.map((r) => r.label)).toEqual(["Windows", "macOS"]);
  });

  it("keeps each city with its country", () => {
    const { rows } = parseReport(
      "cities",
      response(
        ["city", "countryId"],
        ["activeUsers"],
        [
          ["Paris", "FR", 30],
          ["Paris", "US", 2],
          ["(not set)", "de", 4],
          ["(not set)", "NL", 3],
        ],
      ),
      window,
    );
    expect(rows).toEqual([
      { city: "Paris", code: "FR", visitors: 30 },
      { city: "Unknown", code: "", visitors: 7 },
      { city: "Paris", code: "US", visitors: 2 },
    ]);
    expect(buildRequest("cities", window, params).dimensions).toEqual([
      { name: "city" },
      { name: "countryId" },
    ]);
  });

  it("joins sources across both periods", () => {
    const res = response(
      ["sessionSource", "dateRange"],
      ["activeUsers"],
      [
        ["google", "current", 50],
        ["(direct)", "current", 30],
        ["google", "previous", 40],
        ["bing", "previous", 9],
      ],
    );
    expect(parseReport("sources", res, window).rows).toEqual([
      { source: "google", label: "Google", visitors: 50, previous: 40 },
      { source: "(direct)", label: "Direct", visitors: 30, previous: 0 },
      { source: "bing", label: "Bing", visitors: 0, previous: 9 },
    ]);
  });

  it("merges channels that share a plain label", () => {
    const res = response(
      ["sessionDefaultChannelGroup"],
      ["activeUsers"],
      [
        ["Organic Search", 40],
        ["Paid Other", 3],
        ["Cross-network", 2],
      ],
    );
    expect(parseReport("channels", res, window).rows).toEqual([
      { channel: "Organic Search", label: "Search", visitors: 40 },
      { channel: "Paid Other", label: "Other ads", visitors: 5 },
    ]);
  });

  it("groups unknown devices as other", () => {
    const res = response(
      ["deviceCategory"],
      ["activeUsers"],
      [
        ["desktop", 10],
        ["smart tv", 1],
        ["mobile", 7],
      ],
    );
    expect(parseReport("devices", res, window).rows.map((r) => r.label)).toEqual([
      "Desktop",
      "Mobile",
      "Other",
    ]);
  });

  it("reads countries with upper-case codes and plain names", () => {
    const res = response(
      ["countryId", "country"],
      ["activeUsers"],
      [
        ["nl", "Netherlands", 8],
        ["", "(not set)", 1],
      ],
    );
    expect(parseReport("countries", res, window).rows).toEqual([
      { code: "NL", name: "Netherlands", visitors: 8 },
      { code: "", name: "Unknown", visitors: 1 },
    ]);
  });

  it("counts actions per period", () => {
    const res = response(
      ["eventName", "dateRange"],
      ["eventCount"],
      [
        ["sign_up", "current", 12],
        ["sign_up", "previous", 8],
        ["file_download", "current", 3],
      ],
    );
    expect(parseReport("actions", res, window)).toEqual({
      current: { sign_up: 12, file_download: 3 },
      previous: { sign_up: 8 },
    });
  });

  it("names AI assistants and merges their sources", () => {
    const res = response(
      ["sessionSource"],
      ["activeUsers"],
      [
        ["chatgpt.com", 5],
        ["chat.openai.com", 2],
        ["claude.ai", 4],
      ],
    );
    expect(parseReport("ai_sources", res, window).rows).toEqual([
      { assistant: "ChatGPT", visitors: 7 },
      { assistant: "Claude", visitors: 4 },
    ]);
  });

  it("merges landing pages that read the same", () => {
    const res = response(
      ["landingPage"],
      ["activeUsers"],
      [
        ["(not set)", 2],
        ["", 1],
        ["/", 9],
      ],
    );
    expect(parseReport("landing", res, window).rows).toEqual([
      { path: "/", visitors: 9 },
      { path: "Unknown", visitors: 3 },
    ]);
  });

  it("treats bad numbers as zero", () => {
    const rows = readRows(response(["pagePath"], ["screenPageViews"], [["/a", "NaN"]]));
    expect(rows[0]?.metrics.screenPageViews).toBe(0);
  });
});
