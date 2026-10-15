import { describe, expect, it } from "vitest";
import { lastWeekRange, rangeWindow } from "@/lib/ga4/ranges";
import { buildWeeklyEmail, type SiteWeekInput } from "./content";

const monday = new Date("2026-10-12T13:00:00Z");
const window = rangeWindow(lastWeekRange("UTC", monday), "UTC", monday);
const totals = (c: number, p: number) => ({
  current: { visitors: c, pageViews: c * 2, engagementSeconds: c * 60 },
  previous: { visitors: p, pageViews: p * 2, engagementSeconds: p * 60 },
});
const site: SiteWeekInput = {
  siteLabel: "mysite.com",
  window,
  totals: totals(1234, 1003),
  sources: { rows: [{ source: "google", label: "Google", visitors: 900, previous: 700 }] },
  pages: {
    rows: [
      { path: "/", views: 2000, visitors: 1000 },
      { path: "/pricing", views: 300, visitors: 200 },
    ],
  },
  actions: { current: { sign_up: 12 }, previous: { sign_up: 8 } },
  aiSources: { rows: [{ assistant: "ChatGPT", visitors: 40 }] },
  signupEvent: "sign_up",
  comparable: true,
  dashboard: "d",
};
const links = { settings: "s", unsubscribe: "u" };
/** The email for one site, with some of its inputs changed. */
const one = (over: Partial<SiteWeekInput> = {}) =>
  buildWeeklyEmail({ sites: [{ ...site, ...over }], links });
const input = site;

describe("buildWeeklyEmail", () => {
  it("writes the subject from the numbers", () => {
    expect(one()?.subject).toBe("mysite.com: 1,234 visitors last week (up 23%)");
    expect(one({ totals: totals(900, 1000) })?.subject).toBe(
      "mysite.com: 900 visitors last week (down 10%)",
    );
    expect(one({ comparable: false })?.subject).toBe("mysite.com: 1,234 visitors last week");
  });

  it("covers last Monday to Sunday, and says 'the week before'", () => {
    const email = one()!.blocks[0]!;
    expect(email.period).toBe("5 Oct – 11 Oct");
    expect(email.summary).toContain("vs the week before");
    expect(email.summary).toContain("12 signups, up from 8.");
  });

  it("lists the 4 numbers, top sources and pages, and AI visitors when there are any", () => {
    const email = one()!.blocks[0]!;
    expect(email.stats.map((s) => s.label)).toEqual([
      "Visitors",
      "Page views",
      "Avg. time",
      "Signups",
    ]);
    expect(email.pages.map((p) => p.label)).toEqual(["/", "/pricing"]);
    expect(email.aiVisitors).toBe("40");
    expect(one({ aiSources: { rows: [] } })!.blocks[0]!.aiVisitors).toBeNull();
  });

  it("leaves Signups out when no event is chosen", () => {
    expect(one({ signupEvent: null })!.blocks[0]!.stats).toHaveLength(3);
  });

  it("sends nothing when there were no visitors in either week", () => {
    expect(one({ totals: totals(0, 0) })).toBeNull();
    expect(one({ totals: null })).toBeNull();
  });
});

describe("several sites", () => {
  const blog = { ...input, siteLabel: "blog.mysite.com", totals: totals(300, 300), dashboard: "b" };
  const shop = { ...input, siteLabel: "shop.mysite.com", totals: totals(5, 0), dashboard: "c" };

  it("has one block per site, the main one first, each with its own dashboard link", () => {
    const email = buildWeeklyEmail({ sites: [site, blog, shop], links })!;
    expect(email.blocks.map((b) => [b.siteLabel, b.dashboard])).toEqual([
      ["mysite.com", "d"],
      ["blog.mysite.com", "b"],
      ["shop.mysite.com", "c"],
    ]);
  });

  it("names the main site and counts the others in the subject", () => {
    expect(buildWeeklyEmail({ sites: [site, blog, shop], links })!.subject).toBe(
      "Last week: mysite.com 1,234 visitors (up 23%), and 2 more sites",
    );
    expect(buildWeeklyEmail({ sites: [blog, shop], links })!.subject).toBe(
      "Last week: blog.mysite.com 300 visitors (no change), and 1 more site",
    );
  });

  it("leaves out sites without visits, and sends nothing when none had any", () => {
    const quiet = { ...blog, totals: totals(0, 0) };
    const email = buildWeeklyEmail({ sites: [quiet, site], links })!;
    expect(email.blocks.map((b) => b.siteLabel)).toEqual(["mysite.com"]);
    expect(email.subject).toBe("mysite.com: 1,234 visitors last week (up 23%)");
    expect(buildWeeklyEmail({ sites: [quiet], links })).toBeNull();
    expect(buildWeeklyEmail({ sites: [], links })).toBeNull();
  });
});
