import { describe, expect, it } from "vitest";
import { plans } from "@/config/plans";
import {
  monthsFreeLabel,
  monthsFreeOnYearly,
  planInWords,
  priceInWords,
  yearlyLabel,
  yearlySaving,
} from "./prices";

describe("prices", () => {
  it("works out the months free from the prices", () => {
    expect(monthsFreeOnYearly()).toBe(2);
    expect(monthsFreeOnYearly({ month: 10, year: 100 })).toBe(2);
    expect(monthsFreeOnYearly({ month: 9, year: 99 })).toBe(1);
    expect(yearlyLabel()).toBe("Yearly · 2 months free");
  });

  it("works out the yearly saving", () => {
    expect(yearlySaving()).toBe(18);
    expect(yearlySaving(plans.pro.prices)).toBe(18);
    expect(monthsFreeLabel()).toBe("2 months free");
    expect(monthsFreeLabel({ month: 9, year: 99 })).toBe("1 month free");
  });

  it("states Pro's prices in words from plans.ts", () => {
    expect(priceInWords("month")).toBe("$9 a month");
    expect(priceInWords("year")).toBe("$90 a year");
    expect(plans.pro.prices).toEqual({ month: 9, year: 90 });
    expect(plans.free.prices).toEqual({ month: 0, year: 0 });
  });

  it("says the plan in plain words", () => {
    const end = new Date("2027-10-11T12:00:00Z");
    expect(planInWords({ kind: "free" })).toBe("Free");
    const paid = {
      kind: "paid",
      plan: "pro",
      interval: "year",
      renewsAt: end,
      cancelAtPeriodEnd: false,
      pastDue: false,
    } as const;
    expect(planInWords(paid)).toBe("Pro · $90 a year · renews on 11 Oct 2027");
    expect(planInWords({ ...paid, cancelAtPeriodEnd: true })).toBe(
      "Pro · $90 a year · ends on 11 Oct 2027",
    );
    expect(planInWords({ ...paid, interval: "month" })).toBe(
      "Pro · $9 a month · renews on 11 Oct 2027",
    );
    expect(planInWords({ ...paid, interval: null, renewsAt: null })).toBe("Pro");
  });
});
