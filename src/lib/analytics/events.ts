import { currency, plans, type BillingInterval } from "@/config/plans";
import { brand } from "@/config/theme";

/**
 * SimpleDash's own key events for its Google Analytics (docs/SPEC.md section 17), with
 * Google's recommended names and parameters, so GA4 understands them without setup. Only
 * the moments that matter: signing up, signing in, starting checkout and buying Pro.
 * Never an email, a name or a user ID. Pure, so it is tested.
 */

export type AnalyticsEvent = { name: string; params: Record<string, unknown> };

/** The address marker Google sign-in returns with: a new account, or a returning one. */
export const AUTH_PARAM = "auth";
export const AUTH_VALUES = { signup: "sign_up", login: "login" } as const;

/** `sign_up` or `login` for `?auth=signup|login`, or null for anything else. */
export function authEvent(value: unknown): AnalyticsEvent | null {
  if (value !== "signup" && value !== "login") return null;
  return { name: AUTH_VALUES[value], params: { method: "Google" } };
}

/** Pro as an item, the way GA4's ecommerce events describe what was bought. */
function proItem(interval: BillingInterval | null, price: number) {
  return {
    item_id: interval ? `pro_${interval}` : "pro",
    item_name: `${brand.name} ${plans.pro.name}${interval === "year" ? " (yearly)" : interval === "month" ? " (monthly)" : ""}`,
    price,
    quantity: 1,
  };
}

/** `begin_checkout`: "Upgrade to Pro" was sent, for the chosen interval. Prices include tax. */
export function checkoutEvent(interval: BillingInterval): AnalyticsEvent {
  const price = plans.pro.prices[interval];
  return {
    name: "begin_checkout",
    params: { currency, value: price, items: [proItem(interval, price)] },
  };
}

export type Purchase = {
  /** Stripe's Checkout Session ID: GA4 counts a purchase once per transaction ID. */
  transactionId: string;
  /** What was paid before tax, and the tax, in major units. */
  value: number;
  tax: number;
  currency: string;
  interval: BillingInterval | null;
};

/** `purchase`: Stripe confirmed the checkout, with Stripe's own amounts. */
export function purchaseEvent(p: Purchase): AnalyticsEvent {
  return {
    name: "purchase",
    params: {
      transaction_id: p.transactionId,
      currency: p.currency,
      value: p.value,
      tax: p.tax,
      items: [proItem(p.interval, p.value)],
    },
  };
}
