import "server-only";
import Stripe from "stripe";
import type { StripeReads, SubItem } from "./totals";

/**
 * Reading a user's own Stripe account with the restricted key they pasted
 * (docs/SPEC.md section 28.3). Read calls only. Only amounts, currencies, times and
 * subscription prices leave this file: never names, emails, card or customer IDs.
 */

/** Hard stop, so a huge account can't keep a sync running for ever. */
const MAX_OBJECTS = 100_000;

const client = (key: string) => new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 });

export type Readable = "charges" | "refunds" | "customers" | "subscriptions";

/** What Stripe's Dashboard calls each resource, for "give the key Read access to …". */
export const RESOURCE_NAMES: Record<Readable, string> = {
  charges: "Charges",
  refunds: "Refunds",
  customers: "Customers",
  subscriptions: "Subscriptions",
};

export type KeyCheck =
  | { ok: true; livemode: boolean }
  | { ok: false; problem: "invalid" | "unavailable" }
  | { ok: false; problem: "permission"; missing: Readable };

/**
 * "Check and save": one read of each resource, one at a time, so the screen can name
 * the one the key can't read.
 */
export async function checkKey(key: string): Promise<KeyCheck> {
  const stripe = client(key);
  const reads: [Readable, () => Promise<unknown>][] = [
    ["charges", () => stripe.charges.list({ limit: 1 })],
    ["refunds", () => stripe.refunds.list({ limit: 1 })],
    ["customers", () => stripe.customers.list({ limit: 1 })],
    ["subscriptions", () => stripe.subscriptions.list({ limit: 1, status: "all" })],
  ];
  for (const [resource, read] of reads) {
    try {
      await read();
    } catch (error) {
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        return { ok: false, problem: "invalid" };
      }
      if (error instanceof Stripe.errors.StripePermissionError) {
        return { ok: false, problem: "permission", missing: resource };
      }
      return { ok: false, problem: "unavailable" };
    }
  }
  return { ok: true, livemode: key.startsWith("rk_live_") };
}

/** Why a sync couldn't read Stripe: the key stopped working, or Stripe didn't answer. */
export function readProblem(error: unknown): "invalid" | "unavailable" {
  return error instanceof Stripe.errors.StripeAuthenticationError ||
    error instanceof Stripe.errors.StripePermissionError
    ? "invalid"
    : "unavailable";
}

async function collect<T, U>(list: AsyncIterable<T>, pick: (item: T) => U | null): Promise<U[]> {
  const out: U[] = [];
  let seen = 0;
  for await (const item of list) {
    if (++seen > MAX_OBJECTS) break;
    const picked = pick(item);
    if (picked !== null) out.push(picked);
  }
  return out;
}

/** Charges, refunds and new customers created since a time (seconds), reduced to totals' inputs. */
export async function readSince(key: string, since: number): Promise<StripeReads> {
  const stripe = client(key);
  const created = { gte: since };
  const [charges, refunds, customers] = await Promise.all([
    collect(stripe.charges.list({ created, limit: 100 }), (c) =>
      c.status === "succeeded" && c.captured
        ? { created: c.created, amount: c.amount, currency: c.currency }
        : null,
    ),
    collect(stripe.refunds.list({ created, limit: 100 }), (r) =>
      r.status === "succeeded" ? { created: r.created, amount: r.amount, currency: r.currency } : null,
    ),
    collect(stripe.customers.list({ created, limit: 100 }), (c) => ({ created: c.created })),
  ]);
  return { charges, refunds, customers };
}

const INTERVALS = ["day", "week", "month", "year"] as const;
/** Stripe may add intervals; an unknown one can't be counted in MRR. */
const interval = (value: string | undefined): SubItem["interval"] =>
  (INTERVALS as readonly string[]).includes(value ?? "") ? (value as SubItem["interval"]) : null;

/** Active and past-due subscriptions with their prices, for MRR. */
export async function readSubscriptions(
  key: string,
): Promise<{ status: string; items: SubItem[] }[]> {
  const stripe = client(key);
  const pick = (s: Stripe.Subscription) => ({
    status: s.status,
    items: s.items.data.map(
      (item): SubItem => ({
        unitAmount: item.price.unit_amount,
        currency: item.price.currency,
        interval: interval(item.price.recurring?.interval),
        intervalCount: item.price.recurring?.interval_count ?? 1,
        quantity: item.quantity ?? 1,
      }),
    ),
  });
  const [active, pastDue] = await Promise.all([
    collect(stripe.subscriptions.list({ status: "active", limit: 100 }), pick),
    collect(stripe.subscriptions.list({ status: "past_due", limit: 100 }), pick),
  ]);
  return [...active, ...pastDue];
}
