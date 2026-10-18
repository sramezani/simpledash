import "server-only";
import type Stripe from "stripe";
import type { BillingInterval } from "@/config/plans";
import { env } from "@/lib/env";
import type { Purchase } from "@/lib/analytics/events";
import { getBilling } from "./billing";
import { purchaseFromSession } from "./purchase";
import { planState } from "./plan";
import { planPrices, stripe } from "./stripe";

/**
 * Upgrade to Pro (docs/SPEC.md section 16): a Stripe Checkout Session for the chosen
 * interval. The browser only sends "month" or "year"; the price ID is picked here.
 * There's no trial: Free is the way to try SimpleDash.
 */
export async function createCheckout(
  user: { id: string; email: string },
  interval: BillingInterval,
): Promise<string> {
  const row = await getBilling(user.id);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: planPrices().pro[interval], quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, interval },
    subscription_data: { metadata: { userId: user.id } },
    ...(row.stripeCustomerId ? { customer: row.stripeCustomerId } : { customer_email: user.email }),
    // Stripe fills in the session ID, so the dashboard can confirm the purchase (analytics).
    success_url: `${env.APP_URL}/dashboard?upgraded=pro&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/settings/billing`,
    ...(env.STRIPE_MANAGED_PAYMENTS ? { managed_payments: { enabled: true } } : {}),
  };
  const session = await stripe.checkout.sessions.create(params);
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

/** Manage billing: the Stripe Customer Portal (card, invoices, cancel, plans). */
export async function createPortal(userId: string): Promise<string | null> {
  const row = await getBilling(userId);
  if (!row.stripeCustomerId) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${env.APP_URL}/settings/billing`,
  });
  return session.url;
}

/** True when the user already pays, so "Upgrade" opens the Portal instead (monthly ↔ yearly there). */
export async function isPaying(userId: string): Promise<boolean> {
  return planState(await getBilling(userId)).kind === "paid";
}

/**
 * The purchase behind `?session_id=` after Checkout, for SimpleDash's own analytics: read
 * from Stripe, and only when it's this user's paid checkout. Null otherwise, or if Stripe
 * can't be asked (the purchase itself is handled by the webhook, never by this).
 */
export async function checkoutPurchase(
  userId: string,
  sessionId: unknown,
): Promise<Purchase | null> {
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return null;
  try {
    return purchaseFromSession(await stripe.checkout.sessions.retrieve(sessionId), userId);
  } catch {
    return null;
  }
}
