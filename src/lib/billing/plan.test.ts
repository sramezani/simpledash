import { describe, expect, it } from "vitest";
import { entitlements, keepTrialUntil, planState, trialEnd } from "./plan";

const now = new Date("2026-10-12T12:00:00Z");
const base = {
  trialEndsAt: new Date("2026-10-20T12:00:00Z"),
  status: null,
  planInterval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

describe("planState", () => {
  it("is a trial before trial_ends_at, with days left rounded up", () => {
    expect(planState(base, now)).toEqual({ kind: "trial", endsAt: base.trialEndsAt, daysLeft: 8 });
    expect(
      planState({ ...base, trialEndsAt: new Date("2026-10-12T13:00:00Z") }, now),
    ).toMatchObject({
      kind: "trial",
      daysLeft: 1,
    });
  });

  it("is locked after the trial without a paid subscription", () => {
    expect(planState({ ...base, trialEndsAt: new Date("2026-10-01T00:00:00Z") }, now).kind).toBe(
      "locked",
    );
    expect(
      planState({ ...base, trialEndsAt: new Date("2026-10-01T00:00:00Z"), status: "canceled" }, now)
        .kind,
    ).toBe("locked");
    expect(
      planState({ ...base, trialEndsAt: new Date("2026-10-01T00:00:00Z"), status: "unpaid" }, now)
        .kind,
    ).toBe("locked");
  });

  it("is paid for active, trialing and past due", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      const s = planState(
        { ...base, trialEndsAt: new Date("2026-10-01T00:00:00Z"), status, planInterval: "year" },
        now,
      );
      expect(s).toMatchObject({ kind: "paid", interval: "year", pastDue: status === "past_due" });
    }
  });

  it("is Starter when paid before Growth existed, and Growth when the webhook says so", () => {
    const paid = { ...base, status: "active", planInterval: "month" as const };
    expect(planState(paid, now)).toMatchObject({ kind: "paid", plan: "starter" });
    expect(planState({ ...paid, plan: null }, now)).toMatchObject({ plan: "starter" });
    expect(planState({ ...paid, plan: "growth" }, now)).toMatchObject({ plan: "growth" });
  });
});

describe("entitlements", () => {
  const ended = new Date("2026-10-01T00:00:00Z");
  it("gives Growth's limits only to a paid Growth plan", () => {
    const growth = planState({ ...base, status: "active", plan: "growth" }, now);
    expect(entitlements(growth)).toEqual({
      plan: "growth",
      sites: 10,
      searchConsole: true,
      revenue: true,
    });
  });

  it("keeps the trial, paid Starter and locked accounts on Starter's limits", () => {
    const starter = { plan: "starter", sites: 1, searchConsole: false, revenue: false };
    expect(entitlements(planState(base, now))).toEqual(starter);
    expect(entitlements(planState({ ...base, status: "active" }, now))).toEqual(starter);
    expect(entitlements(planState({ ...base, trialEndsAt: ended }, now))).toEqual(starter);
    // A Growth subscription that stopped: back to Starter's limits (and locked).
    expect(
      entitlements(
        planState({ ...base, trialEndsAt: ended, status: "canceled", plan: "growth" }, now),
      ),
    ).toEqual(starter);
  });
});

describe("trial dates", () => {
  it("lasts 14 days from sign-up", () => {
    expect(trialEnd(new Date("2026-10-01T10:00:00Z")).toISOString()).toBe(
      "2026-10-15T10:00:00.000Z",
    );
  });

  it("keeps the rest of the trial only with 48 hours or more left", () => {
    expect(keepTrialUntil(new Date("2026-10-14T12:00:00Z"), now)).toEqual(
      new Date("2026-10-14T12:00:00Z"),
    );
    expect(keepTrialUntil(new Date("2026-10-14T11:59:00Z"), now)).toBeNull();
  });
});
