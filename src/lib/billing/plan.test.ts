import { describe, expect, it } from "vitest";
import { plans } from "@/config/plans";
import { effectivePlan, entitlements, isPaidStatus, planState } from "./plan";

const base = {
  status: null,
  planInterval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

describe("planState", () => {
  it("is Free without a subscription, and after one stopped", () => {
    expect(planState(base)).toEqual({ kind: "free" });
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(planState({ ...base, status, plan: "pro" }).kind).toBe("free");
    }
  });

  it("is paid Pro for active, trialing and past due", () => {
    const renews = new Date("2026-11-14T00:00:00Z");
    for (const status of ["active", "trialing", "past_due"]) {
      expect(
        planState({ ...base, status, planInterval: "year", currentPeriodEnd: renews }),
      ).toEqual({
        kind: "paid",
        plan: "pro",
        interval: "year",
        renewsAt: renews,
        cancelAtPeriodEnd: false,
        pastDue: status === "past_due",
      });
    }
  });

  it("keeps cancel at period end on a paid plan", () => {
    expect(planState({ ...base, status: "active", cancelAtPeriodEnd: true })).toMatchObject({
      kind: "paid",
      cancelAtPeriodEnd: true,
    });
  });
});

describe("isPaidStatus", () => {
  it("knows Stripe's paying states", () => {
    expect(isPaidStatus("active")).toBe(true);
    expect(isPaidStatus("past_due")).toBe(true);
    expect(isPaidStatus("canceled")).toBe(false);
    expect(isPaidStatus(null)).toBe(false);
  });
});

describe("entitlements", () => {
  it("gives Free its limits, with nothing locked away for good", () => {
    const free = entitlements(planState(base));
    expect(free).toEqual({ plan: "free", ...plans.free.limits });
    expect(free).toMatchObject({
      sites: 1,
      fullHistory: false,
      weeklyEmail: false,
      searchConsole: false,
      revenue: false,
      poweredBy: true,
    });
  });

  it("gives Pro everything, and takes it back when the subscription stops", () => {
    const pro = entitlements(planState({ ...base, status: "active" }));
    expect(pro).toEqual({
      plan: "pro",
      sites: 10,
      fullHistory: true,
      weeklyEmail: true,
      searchConsole: true,
      revenue: true,
      poweredBy: false,
    });
    expect(effectivePlan(planState({ ...base, status: "canceled", plan: "pro" }))).toBe("free");
  });
});
