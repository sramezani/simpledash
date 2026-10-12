import { describe, expect, it } from "vitest";
import { buildSummary, type SummaryInput } from "./summary";

const totals = (current: number, previous: number) => ({
  current: { visitors: current, pageViews: 0, engagementSeconds: 0 },
  previous: { visitors: previous, pageViews: 0, engagementSeconds: 0 },
});
const sources = (...rows: [string, number, number][]) => ({
  rows: rows.map(([source, visitors, previous]) => ({ source, label: source, visitors, previous })),
});

const base: SummaryInput = {
  range: "7d",
  totals: totals(123, 100),
  sources: sources(["google", 70, 50], ["(direct)", 53, 50]),
  actions: null,
  signupEvent: null,
  comparable: true,
};

describe("buildSummary rule 1: visitors change", () => {
  it("says up and down with a whole-number %", () => {
    expect(buildSummary({ ...base, sources: null })).toBe(
      "Visitors up 23% vs the previous 7 days.",
    );
    expect(buildSummary({ ...base, totals: totals(88, 100), sources: null })).toBe(
      "Visitors down 12% vs the previous 7 days.",
    );
  });

  it("says about the same under ±3%", () => {
    expect(buildSummary({ ...base, totals: totals(102, 100) })).toBe(
      "Visitors about the same as the previous 7 days.",
    );
    expect(buildSummary({ ...base, totals: totals(98, 100) })).toBe(
      "Visitors about the same as the previous 7 days.",
    );
    expect(buildSummary({ ...base, totals: totals(103, 100), sources: null })).toBe(
      "Visitors up 3% vs the previous 7 days.",
    );
  });

  it("rounds before deciding (2.5% rounds to 3%)", () => {
    expect(buildSummary({ ...base, totals: totals(1025, 1000), sources: null })).toBe(
      "Visitors up 3% vs the previous 7 days.",
    );
  });

  it("uses the period's words", () => {
    expect(buildSummary({ ...base, range: "30d", sources: null })).toBe(
      "Visitors up 23% vs the previous 30 days.",
    );
    expect(buildSummary({ ...base, range: "12m", sources: null })).toBe(
      "Visitors up 23% vs the previous 12 months.",
    );
    expect(buildSummary({ ...base, audience: "email", sources: null })).toBe(
      "Visitors up 23% vs the week before.",
    );
  });
});

describe("buildSummary rule 2: main source of the change", () => {
  it("names a source behind 50% or more of the net change, same direction", () => {
    // Net change +23: Google +20 (87%), Direct +3.
    expect(buildSummary(base)).toBe("Visitors up 23% vs the previous 7 days, mostly from Google.");
  });

  it("names exactly 50%", () => {
    const s = sources(["google", 60, 50], ["bing", 60, 50]);
    expect(buildSummary({ ...base, totals: totals(120, 100), sources: s })).toBe(
      "Visitors up 20% vs the previous 7 days, mostly from Google.",
    );
  });

  it("says nothing when no source makes up half", () => {
    const s = sources(["google", 60, 50], ["bing", 60, 50], ["t.co", 30, 20]);
    expect(buildSummary({ ...base, totals: totals(130, 100), sources: s })).toBe(
      "Visitors up 30% vs the previous 7 days.",
    );
  });

  it("ignores a source that moved the other way", () => {
    // Net −20. Google fell 30 (150% of the change), Direct grew 10.
    const s = sources(["google", 20, 50], ["(direct)", 60, 50]);
    expect(buildSummary({ ...base, totals: totals(80, 100), sources: s })).toBe(
      "Visitors down 20% vs the previous 7 days, mostly from Google.",
    );
    const opposite = sources(["(direct)", 90, 60], ["google", 0, 40]);
    expect(buildSummary({ ...base, totals: totals(90, 100), sources: opposite })).toBe(
      "Visitors down 10% vs the previous 7 days, mostly from Google.",
    );
  });

  it("calls direct traffic direct visits", () => {
    const s = sources(["(direct)", 80, 50], ["google", 43, 50]);
    expect(buildSummary({ ...base, sources: s })).toBe(
      "Visitors up 23% vs the previous 7 days, mostly from direct visits.",
    );
  });

  it("never names an unknown source", () => {
    const s = sources(["(not set)", 90, 50], ["google", 33, 50]);
    expect(buildSummary({ ...base, sources: s })).toBe("Visitors up 23% vs the previous 7 days.");
    const most = sources(["(not set)", 700, 0], ["google", 534, 0]);
    expect(buildSummary({ ...base, totals: totals(1234, 0), sources: most })).toBe(
      "1,234 visitors in the last 7 days.",
    );
  });

  it("adds no source to 'about the same'", () => {
    expect(buildSummary({ ...base, totals: totals(101, 100) })).toBe(
      "Visitors about the same as the previous 7 days.",
    );
  });
});

describe("buildSummary rule 3: no comparison possible", () => {
  it("states the count when the previous period is zero", () => {
    expect(buildSummary({ ...base, totals: totals(1234, 0), sources: null })).toBe(
      "1,234 visitors in the last 7 days.",
    );
  });

  it("states the count when the property is too new", () => {
    const s = sources(["google", 700, 0], ["(direct)", 534, 0]);
    expect(
      buildSummary({ ...base, totals: totals(1234, 900), sources: s, comparable: false }),
    ).toBe("1,234 visitors in the last 7 days, mostly from Google.");
  });

  it("handles zero and one visitor", () => {
    expect(buildSummary({ ...base, totals: totals(0, 0), sources: null })).toBe(
      "0 visitors in the last 7 days.",
    );
    expect(buildSummary({ ...base, totals: totals(1, 0), sources: null })).toBe(
      "1 visitor in the last 7 days.",
    );
  });

  it("says last week in the email", () => {
    expect(buildSummary({ ...base, totals: totals(5, 0), sources: null, audience: "email" })).toBe(
      "5 visitors last week.",
    );
  });
});

describe("buildSummary rule 4: signups", () => {
  const withSignups = (now: number, before: number) => ({
    ...base,
    sources: null,
    signupEvent: "sign_up",
    actions: { current: { sign_up: now }, previous: { sign_up: before } },
  });

  it("compares signups", () => {
    expect(buildSummary(withSignups(12, 8))).toBe(
      "Visitors up 23% vs the previous 7 days. 12 signups, up from 8.",
    );
    expect(buildSummary(withSignups(12, 15))).toBe(
      "Visitors up 23% vs the previous 7 days. 12 signups, down from 15.",
    );
    expect(buildSummary(withSignups(12, 12))).toBe(
      "Visitors up 23% vs the previous 7 days. 12 signups, same as before.",
    );
    expect(buildSummary(withSignups(1, 0))).toBe(
      "Visitors up 23% vs the previous 7 days. 1 signup, up from 0.",
    );
  });

  it("leaves signups out when there are none, or no event is chosen", () => {
    expect(buildSummary(withSignups(0, 0))).toBe("Visitors up 23% vs the previous 7 days.");
    expect(buildSummary({ ...withSignups(5, 2), signupEvent: null })).toBe(
      "Visitors up 23% vs the previous 7 days.",
    );
  });

  it("doesn't compare signups when the history is too short", () => {
    expect(buildSummary({ ...withSignups(5, 2), comparable: false })).toBe(
      "123 visitors in the last 7 days. 5 signups.",
    );
  });
});

describe("buildSummary rule 5: no reasons", () => {
  it("never explains why", () => {
    const texts = [buildSummary(base), buildSummary({ ...base, totals: totals(50, 100) })];
    for (const t of texts) expect(t).not.toMatch(/because|due to|thanks to/i);
  });

  it("returns null without totals", () => {
    expect(buildSummary({ ...base, totals: null })).toBeNull();
  });
});

describe("buildSummary for single days", () => {
  it("says today so far, without a comparison", () => {
    expect(
      buildSummary({ ...base, range: "today", comparable: false, totals: totals(12, 40) }),
    ).toBe("12 visitors today so far, mostly from Google.");
  });

  it("compares yesterday with the day before", () => {
    expect(buildSummary({ ...base, range: "yesterday", sources: null })).toBe(
      "Visitors up 23% vs the day before.",
    );
  });
});
