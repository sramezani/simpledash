import { describe, expect, it } from "vitest";
import { rangeWindow } from "@/lib/ga4/ranges";
import { buildWeeklyEmail, type WeeklyEmailInput } from "./content";

const window = rangeWindow("7d", "UTC", new Date("2026-10-12T13:00:00Z")); // a Monday
const totals = (c: number, p: number) => ({
  current: { visitors: c, pageViews: c * 2, engagementSeconds: c * 60 },
  previous: { visitors: p, pageViews: p * 2, engagementSeconds: p * 60 },
});
const input: WeeklyEmailInput = {
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
  links: { dashboard: "d", settings: "s", unsubscribe: "u" },
};

describe("buildWeeklyEmail", () => {
  it("writes the subject from the numbers", () => {
    expect(buildWeeklyEmail(input)?.subject).toBe("mysite.com: 1,234 visitors last week (up 23%)");
    expect(buildWeeklyEmail({ ...input, totals: totals(900, 1000) })?.subject).toBe(
      "mysite.com: 900 visitors last week (down 10%)",
    );
    expect(buildWeeklyEmail({ ...input, comparable: false })?.subject).toBe(
      "mysite.com: 1,234 visitors last week",
    );
  });

  it("covers last Monday to Sunday, and says 'the week before'", () => {
    const email = buildWeeklyEmail(input)!;
    expect(email.period).toBe("5 Oct – 11 Oct");
    expect(email.summary).toContain("vs the week before");
    expect(email.summary).toContain("12 signups, up from 8.");
  });

  it("lists the 4 numbers, top sources and pages, and AI visitors when there are any", () => {
    const email = buildWeeklyEmail(input)!;
    expect(email.stats.map((s) => s.label)).toEqual([
      "Visitors",
      "Page views",
      "Avg. time",
      "Signups",
    ]);
    expect(email.pages.map((p) => p.label)).toEqual(["/", "/pricing"]);
    expect(email.aiVisitors).toBe("40");
    expect(buildWeeklyEmail({ ...input, aiSources: { rows: [] } })!.aiVisitors).toBeNull();
  });

  it("leaves Signups out when no event is chosen", () => {
    expect(buildWeeklyEmail({ ...input, signupEvent: null })!.stats).toHaveLength(3);
  });

  it("sends nothing when there were no visitors in either week", () => {
    expect(buildWeeklyEmail({ ...input, totals: totals(0, 0) })).toBeNull();
    expect(buildWeeklyEmail({ ...input, totals: null })).toBeNull();
  });
});
