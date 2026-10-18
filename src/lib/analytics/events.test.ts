import { describe, expect, it } from "vitest";
import { plans } from "@/config/plans";
import { purchaseFromSession, type CheckoutSessionLike } from "@/lib/billing/purchase";
import { authEvent, checkoutEvent, purchaseEvent } from "./events";

describe("authEvent", () => {
  it("names Google's recommended sign_up and login events", () => {
    expect(authEvent("signup")).toEqual({ name: "sign_up", params: { method: "Google" } });
    expect(authEvent("login")).toEqual({ name: "login", params: { method: "Google" } });
    expect(authEvent("other")).toBeNull();
    expect(authEvent(undefined)).toBeNull();
  });
});

describe("checkoutEvent", () => {
  it("sends the chosen interval's price from plans.ts, with Pro as the item", () => {
    const event = checkoutEvent("year");
    expect(event.name).toBe("begin_checkout");
    expect(event.params).toEqual({
      currency: "USD",
      value: plans.pro.prices.year,
      items: [
        {
          item_id: "pro_year",
          item_name: "SimpleDash Pro (yearly)",
          price: plans.pro.prices.year,
          quantity: 1,
        },
      ],
    });
  });
});

describe("purchase", () => {
  const session: CheckoutSessionLike = {
    id: "cs_test_123",
    client_reference_id: "user-1",
    status: "complete",
    payment_status: "paid",
    amount_total: 1089,
    currency: "eur",
    total_details: { amount_tax: 189 },
    metadata: { userId: "user-1", interval: "month" },
  };

  it("takes Stripe's own amounts, before tax and the tax, for the user's paid checkout", () => {
    const purchase = purchaseFromSession(session, "user-1");
    expect(purchase).toEqual({
      transactionId: "cs_test_123",
      value: 9,
      tax: 1.89,
      currency: "EUR",
      interval: "month",
    });
    expect(purchaseEvent(purchase!)).toEqual({
      name: "purchase",
      params: {
        transaction_id: "cs_test_123",
        currency: "EUR",
        value: 9,
        tax: 1.89,
        items: [
          { item_id: "pro_month", item_name: "SimpleDash Pro (monthly)", price: 9, quantity: 1 },
        ],
      },
    });
  });

  it("ignores someone else's, unfinished or unpaid checkouts", () => {
    expect(purchaseFromSession(session, "user-2")).toBeNull();
    expect(purchaseFromSession({ ...session, status: "open" }, "user-1")).toBeNull();
    expect(purchaseFromSession({ ...session, payment_status: "unpaid" }, "user-1")).toBeNull();
  });

  it("works without the interval in the metadata (older checkouts)", () => {
    const purchase = purchaseFromSession({ ...session, metadata: null }, "user-1")!;
    expect(purchase.interval).toBeNull();
    expect(purchaseEvent(purchase).params.items).toEqual([
      { item_id: "pro", item_name: "SimpleDash Pro", price: 9, quantity: 1 },
    ]);
  });
});
