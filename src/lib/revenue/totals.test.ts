import { describe, expect, it } from "vitest";
import {
  backfillStart,
  bucketDays,
  covers,
  keyKind,
  latestMrr,
  monthlyAmount,
  mrr,
  periodRevenue,
  syncFrom,
  visitorsPerCustomer,
  type StoredDay,
} from "./totals";

const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

describe("keyKind", () => {
  const tail = "51AbCdEfGhIjKlMnOpQrStUvWx";
  it("accepts only restricted keys, and says which mode", () => {
    expect(keyKind(`rk_live_${tail}`)).toBe("restricted_live");
    expect(keyKind(` rk_test_${tail} `)).toBe("restricted_test");
  });
  it("refuses secret and publishable keys, and anything else", () => {
    expect(keyKind(`sk_live_${tail}`)).toBe("secret");
    expect(keyKind(`sk_test_${tail}`)).toBe("secret");
    expect(keyKind(`pk_live_${tail}`)).toBe("publishable");
    expect(keyKind("rk_live_short")).toBe("invalid");
    expect(keyKind("hello")).toBe("invalid");
  });
});

describe("bucketDays", () => {
  it("adds up each day in the site's time zone, per currency", () => {
    const days = bucketDays(
      {
        charges: [
          { created: at("2026-10-05T10:00:00Z"), amount: 1900, currency: "eur" },
          { created: at("2026-10-05T23:30:00Z"), amount: 900, currency: "eur" }, // 6 Oct in Amsterdam
          { created: at("2026-10-05T12:00:00Z"), amount: 1500, currency: "usd" },
        ],
        refunds: [{ created: at("2026-10-05T15:00:00Z"), amount: 900, currency: "eur" }],
        customers: [{ created: at("2026-10-05T09:00:00Z") }, { created: at("2026-10-05T22:30:00Z") }],
      },
      "Europe/Amsterdam",
    );
    expect(days.get("2026-10-05")).toEqual({
      money: { EUR: { charged: 1900, refunded: 900 }, USD: { charged: 1500, refunded: 0 } },
      newCustomers: 1,
    });
    expect(days.get("2026-10-06")).toEqual({
      money: { EUR: { charged: 900, refunded: 0 } },
      newCustomers: 1,
    });
  });
});

describe("mrr", () => {
  const item = (unitAmount: number | null, interval: "month" | "year" | "week" | null, extra = {}) => ({
    unitAmount,
    currency: "eur",
    interval,
    intervalCount: 1,
    quantity: 1,
    ...extra,
  });

  it("turns every price into a monthly amount", () => {
    expect(monthlyAmount(item(1900, "month"))).toBe(1900);
    expect(monthlyAmount(item(19000, "year"))).toBeCloseTo(1583.33, 1);
    expect(monthlyAmount(item(1200, "week"))).toBe(5200);
    expect(monthlyAmount(item(5000, "month", { intervalCount: 3, quantity: 2 }))).toBeCloseTo(3333.33, 1);
    expect(monthlyAmount(item(null, "month"))).toBeNull();
  });

  it("counts active and past-due subscriptions, not trials or cancelled ones", () => {
    const result = mrr([
      { status: "active", items: [item(1900, "month")] },
      { status: "past_due", items: [item(19000, "year")] },
      { status: "trialing", items: [item(1900, "month")] },
      { status: "canceled", items: [item(1900, "month")] },
      { status: "active", items: [item(null, "month")] }, // usage-based
    ]);
    expect(result).toEqual({ amounts: { EUR: 3483 }, leftOut: 1 });
  });
});

describe("periodRevenue", () => {
  const days: StoredDay[] = [
    { day: "2026-10-01", money: { EUR: { charged: 5000, refunded: 0 } }, newCustomers: 2, mrr: null },
    {
      day: "2026-10-03",
      money: { EUR: { charged: 2000, refunded: 1000 }, USD: { charged: 900, refunded: 0 } },
      newCustomers: 1,
      mrr: { EUR: 12000 },
    },
    { day: "2026-10-09", money: { EUR: { charged: 9900, refunded: 0 } }, newCustomers: 5, mrr: null },
  ];

  it("adds up charged minus refunded in the main currency, and names the others", () => {
    const r = periodRevenue(days, { start: "2026-10-01", end: "2026-10-07" });
    expect(r).toMatchObject({
      currency: "EUR",
      revenue: 6000,
      charged: 7000,
      refunded: 1000,
      newCustomers: 3,
      others: [{ currency: "USD", revenue: 900 }],
    });
    expect([...r.byDay]).toEqual([
      ["2026-10-01", 5000],
      ["2026-10-03", 1000],
    ]);
  });

  it("is zero with nothing in the period, in the usual currency", () => {
    const r = periodRevenue(days, { start: "2026-09-01", end: "2026-09-30" }, "USD");
    expect(r).toMatchObject({ currency: "USD", revenue: 0, newCustomers: 0, others: [] });
  });

  it("finds the newest MRR recorded", () => {
    expect(latestMrr(days, "2026-10-09")).toEqual({ day: "2026-10-03", amounts: { EUR: 12000 } });
    expect(latestMrr(days, "2026-10-02")).toBeNull();
  });
});

describe("sync days", () => {
  it("reads 25 months back the first time, then from 2 days before the last sync", () => {
    expect(backfillStart("2026-10-13")).toBe("2024-09-01");
    expect(syncFrom(null, "2024-09-01", "UTC")).toBe("2024-09-01");
    expect(syncFrom(new Date("2026-10-13T08:00:00Z"), "2024-09-01", "UTC")).toBe("2026-10-11");
  });

  it("knows whether the totals cover a period", () => {
    expect(covers("2024-09-01", { start: "2025-10-01", end: "2026-09-30" })).toBe(true);
    expect(covers("2024-09-01", { start: "2024-08-01", end: "2024-08-31" })).toBe(false);
    expect(covers(null, { start: "2026-10-01", end: "2026-10-07" })).toBe(false);
  });

  it("says visitors per new customer only with customers", () => {
    expect(visitorsPerCustomer(4120, 10)).toBe(412);
    expect(visitorsPerCustomer(4120, 0)).toBeNull();
  });
});
