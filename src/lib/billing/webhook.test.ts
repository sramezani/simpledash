import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleStripeEvent,
  subscriptionFacts,
  type SubscriptionFacts,
  type WebhookDeps,
} from "./webhook";

const prices = { pro: { month: "price_month", year: "price_year" } };
const NOW = new Date("2026-10-12T12:00:00Z");

function subscription(
  over: Partial<Stripe.Subscription> & { priceId?: string; periodEnd?: number } = {},
) {
  const { priceId = "price_month", periodEnd = 1_800_000_000, ...rest } = over;
  return {
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    metadata: { userId: "user_1" },
    items: {
      data: [
        {
          price: {
            id: priceId,
            recurring: { interval: priceId.endsWith("year") ? "year" : "month" },
          },
          current_period_end: periodEnd,
        },
      ],
    },
    ...rest,
  } as unknown as Stripe.Subscription;
}

function event(
  type: string,
  object: unknown,
  created = 1_790_000_000,
  id = `evt_${type}_${created}`,
) {
  return { id, type, created, data: { object } } as unknown as Stripe.Event;
}

function makeDeps(stored: { stateAt: Date | null } = { stateAt: null }) {
  const seen = new Set<string>();
  const applied: { userId: string; facts: SubscriptionFacts; stateAt: Date }[] = [];
  const deps: WebhookDeps & { applied: typeof applied; seen: Set<string> } = {
    applied,
    seen,
    rememberEvent: async (id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    },
    forgetEvent: async (id) => {
      seen.delete(id);
    },
    retrieveSubscription: vi.fn(async () => subscription()),
    findUserByCustomer: vi.fn(async () => "user_from_customer"),
    userExists: vi.fn(async () => true),
    cancelOrphan: vi.fn(async () => {}),
    applySubscription: async (userId, facts, stateAt) => {
      if (stored.stateAt && stateAt < stored.stateAt) return false;
      stored.stateAt = stateAt;
      applied.push({ userId, facts, stateAt });
      return true;
    },
    reportUnknownPrice: vi.fn(),
    now: () => NOW,
  };
  return deps;
}

describe("signature check", () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({
    id: "evt_1",
    object: "event",
    type: "invoice.paid",
    data: { object: {} },
  });

  it("accepts a correctly signed event", async () => {
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    const evt = await stripe.webhooks.constructEventAsync(payload, header, secret);
    expect(evt.id).toBe("evt_1");
  });

  it("rejects a wrong signature or a changed body", async () => {
    const header = await stripe.webhooks.generateTestHeaderStringAsync({
      payload,
      secret: "whsec_other",
    });
    await expect(stripe.webhooks.constructEventAsync(payload, header, secret)).rejects.toThrow();
    const good = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    await expect(
      stripe.webhooks.constructEventAsync(payload + " ", good, secret),
    ).rejects.toThrow();
  });
});

describe("subscriptionFacts", () => {
  it("turns the price into the plan and interval", () => {
    expect(subscriptionFacts(subscription({ priceId: "price_month" }), prices)).toMatchObject({
      plan: "pro",
      interval: "month",
      unknownPrice: false,
    });
    expect(subscriptionFacts(subscription({ priceId: "price_year" }), prices)).toMatchObject({
      plan: "pro",
      interval: "year",
      unknownPrice: false,
    });
  });

  it("flags a price that isn't one of ours, and keeps the paying customer on Pro", () => {
    expect(subscriptionFacts(subscription({ priceId: "price_other" }), prices)).toMatchObject({
      plan: "pro",
      interval: "month",
      unknownPrice: true,
    });
    expect(subscriptionFacts(subscription({ priceId: "price_other_year" }), prices)).toMatchObject({
      plan: "pro",
      interval: "year",
      unknownPrice: true,
    });
  });

  it("reads the period end from the item and the user from the metadata", () => {
    const f = subscriptionFacts(subscription({ periodEnd: 1_800_000_000 }), prices);
    expect(f.currentPeriodEnd?.toISOString()).toBe(new Date(1_800_000_000_000).toISOString());
    expect(f.userId).toBe("user_1");
    expect(f.customerId).toBe("cus_1");
  });

  it("counts a cancel date from the Customer Portal as cancelling", () => {
    expect(subscriptionFacts(subscription(), prices).cancelAtPeriodEnd).toBe(false);
    expect(
      subscriptionFacts(subscription({ cancel_at_period_end: true }), prices).cancelAtPeriodEnd,
    ).toBe(true);
    expect(
      subscriptionFacts(subscription({ cancel_at: 1_800_000_000 }), prices).cancelAtPeriodEnd,
    ).toBe(true);
  });
});

describe("handleStripeEvent", () => {
  let deps: ReturnType<typeof makeDeps>;
  beforeEach(() => {
    deps = makeDeps();
  });

  it("applies checkout.session.completed with the user from client_reference_id", async () => {
    const result = await handleStripeEvent(
      event("checkout.session.completed", {
        mode: "subscription",
        subscription: "sub_1",
        client_reference_id: "user_9",
      }),
      deps,
      prices,
    );
    expect(result).toBe("applied");
    expect(deps.applied[0]).toMatchObject({
      userId: "user_9",
      facts: { status: "active" },
      stateAt: NOW,
    });
  });

  it("maps each subscription event to its status", async () => {
    for (const [type, status, t] of [
      ["customer.subscription.created", "trialing", 1],
      ["customer.subscription.updated", "past_due", 2],
      ["customer.subscription.deleted", "canceled", 3],
    ] as const) {
      await handleStripeEvent(
        event(type, subscription({ status }), 1_790_000_000 + t),
        deps,
        prices,
      );
      expect(deps.applied.at(-1)?.facts.status).toBe(status);
    }
  });

  it("stores the interval from the price when someone switches yearly and back", async () => {
    await handleStripeEvent(
      event("customer.subscription.updated", subscription({ priceId: "price_year" }), 1),
      deps,
      prices,
    );
    expect(deps.applied.at(-1)?.facts).toMatchObject({ plan: "pro", interval: "year" });
    await handleStripeEvent(
      event("customer.subscription.updated", subscription({ priceId: "price_month" }), 2),
      deps,
      prices,
    );
    expect(deps.applied.at(-1)?.facts).toMatchObject({ plan: "pro", interval: "month" });
  });

  it("refreshes from Stripe on invoice events", async () => {
    const result = await handleStripeEvent(
      event("invoice.payment_failed", {
        parent: { subscription_details: { subscription: "sub_1" } },
      }),
      deps,
      prices,
    );
    expect(result).toBe("applied");
    expect(deps.retrieveSubscription).toHaveBeenCalledWith("sub_1");
  });

  it("skips a repeated event", async () => {
    const e = event("customer.subscription.updated", subscription());
    expect(await handleStripeEvent(e, deps, prices)).toBe("applied");
    expect(await handleStripeEvent(e, deps, prices)).toBe("duplicate");
    expect(deps.applied).toHaveLength(1);
  });

  it("keeps the newest state when events arrive out of order", async () => {
    const newer = event(
      "customer.subscription.updated",
      subscription({ status: "canceled" }),
      1_790_000_200,
      "evt_b",
    );
    const older = event(
      "customer.subscription.updated",
      subscription({ status: "active" }),
      1_790_000_100,
      "evt_a",
    );
    expect(await handleStripeEvent(newer, deps, prices)).toBe("applied");
    expect(await handleStripeEvent(older, deps, prices)).toBe("stale");
    expect(deps.applied.at(-1)?.facts.status).toBe("canceled");
  });

  it("finds the user by customer when the metadata has none", async () => {
    await handleStripeEvent(
      event("customer.subscription.updated", subscription({ metadata: {} })),
      deps,
      prices,
    );
    expect(deps.applied[0]?.userId).toBe("user_from_customer");
  });

  it("reports an unknown price", async () => {
    await handleStripeEvent(
      event("customer.subscription.updated", subscription({ priceId: "price_x" })),
      deps,
      prices,
    );
    expect(deps.reportUnknownPrice).toHaveBeenCalledWith("price_x", "sub_1");
  });

  it("cancels a running subscription whose account was deleted", async () => {
    deps.userExists = vi.fn(async () => false);
    const result = await handleStripeEvent(
      event("customer.subscription.updated", subscription()),
      deps,
      prices,
    );
    expect(result).toBe("no-user");
    expect(deps.cancelOrphan).toHaveBeenCalledWith("sub_1", "user_1");
    expect(deps.applied).toHaveLength(0);
  });

  it("doesn't cancel again when the deleted account's subscription is already over", async () => {
    deps.userExists = vi.fn(async () => false);
    await handleStripeEvent(
      event("customer.subscription.deleted", subscription({ status: "canceled" })),
      deps,
      prices,
    );
    expect(deps.cancelOrphan).not.toHaveBeenCalled();
  });

  it("ignores subscriptions of other products without reporting them", async () => {
    deps.findUserByCustomer = vi.fn(async () => null);
    const result = await handleStripeEvent(
      event("customer.subscription.updated", subscription({ metadata: {}, priceId: "price_x" })),
      deps,
      prices,
    );
    expect(result).toBe("no-user");
    expect(deps.reportUnknownPrice).not.toHaveBeenCalled();
  });

  it("forgets the event when handling fails, so Stripe's retry runs", async () => {
    deps.retrieveSubscription = vi.fn(async () => {
      throw new Error("Stripe down");
    });
    const e = event("invoice.paid", {
      parent: { subscription_details: { subscription: "sub_1" } },
    });
    await expect(handleStripeEvent(e, deps, prices)).rejects.toThrow("Stripe down");
    expect(deps.seen.has(e.id)).toBe(false);
  });

  it("ignores other events", async () => {
    expect(await handleStripeEvent(event("charge.refunded", {}), deps, prices)).toBe("ignored");
    expect(deps.seen.size).toBe(0);
  });
});
