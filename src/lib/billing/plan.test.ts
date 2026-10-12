import { describe, expect, it } from "vitest";
import { keepTrialUntil, planState, trialEnd } from "./plan";

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
