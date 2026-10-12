import { describe, expect, it } from "vitest";
import { plans } from "@/config/plans";
import { monthsFreeOnYearly, planInWords, priceInWords, yearlyLabel } from "./prices";

describe("prices", () => {
  it("works out the months free from the prices", () => {
    expect(monthsFreeOnYearly()).toBe(2);
    expect(monthsFreeOnYearly({ month: 10, year: 100 })).toBe(2);
    expect(monthsFreeOnYearly({ month: 9, year: 99 })).toBe(1);
    expect(yearlyLabel()).toBe("Yearly · 2 months free");
  });

  it("states prices in words from plans.ts", () => {
    expect(priceInWords("month")).toBe("€9 a month");
    expect(priceInWords("year")).toBe("€90 a year");
    expect(plans.growth.prices.month).toBe(19);
  });

  it("says the plan in plain words", () => {
    const end = new Date("2027-10-11T12:00:00Z");
    expect(planInWords({ kind: "trial", endsAt: end, daysLeft: 9 })).toBe(
      "Free trial · 9 days left",
    );
    expect(planInWords({ kind: "trial", endsAt: end, daysLeft: 1 })).toBe(
      "Free trial · 1 day left",
    );
    expect(planInWords({ kind: "locked", trialEndedAt: end })).toBe(
      "Free trial ended on 11 Oct 2027",
    );
    const paid = {
      kind: "paid",
      interval: "year",
      renewsAt: end,
      cancelAtPeriodEnd: false,
      pastDue: false,
    } as const;
    expect(planInWords(paid)).toBe("Starter · €90 a year · renews on 11 Oct 2027");
    expect(planInWords({ ...paid, cancelAtPeriodEnd: true })).toBe(
      "Starter · €90 a year · ends on 11 Oct 2027",
    );
    expect(planInWords({ ...paid, interval: null, renewsAt: null })).toBe("Starter");
  });
});
