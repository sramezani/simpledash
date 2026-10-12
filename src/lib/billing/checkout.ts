import "server-only";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { getBilling } from "./billing";
import { keepTrialUntil, planState } from "./plan";
import { stripe } from "./stripe";

/**
 * Upgrade (docs/SPEC.md section 16): a Stripe Checkout Session for the chosen
 * interval. The browser only sends "month" or "year"; the price ID is picked here.
 */
export async function createCheckout(
  user: { id: string; email: string },
  interval: "month" | "year",
): Promise<string> {
  const row = await getBilling(user.id);
  const keepTrial = keepTrialUntil(row.trialEndsAt);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [
      {
        price: interval === "month" ? env.STRIPE_PRICE_MONTHLY : env.STRIPE_PRICE_YEARLY,
        quantity: 1,
      },
    ],
    client_reference_id: user.id,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
      ...(keepTrial ? { trial_end: Math.floor(keepTrial.getTime() / 1000) } : {}),
    },
    ...(row.stripeCustomerId ? { customer: row.stripeCustomerId } : { customer_email: user.email }),
    success_url: `${env.APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${env.APP_URL}/settings`,
    ...(env.STRIPE_MANAGED_PAYMENTS ? { managed_payments: { enabled: true } } : {}),
  };
  const session = await stripe.checkout.sessions.create(params);
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

/** Manage billing: the Stripe Customer Portal (card, invoices, cancel, monthly ↔ yearly). */
export async function createPortal(userId: string): Promise<string | null> {
  const row = await getBilling(userId);
  if (!row.stripeCustomerId) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${env.APP_URL}/settings`,
  });
  return session.url;
}

/** True when the user already pays, so "Upgrade" should open the portal instead. */
export async function isPaying(userId: string): Promise<boolean> {
  return planState(await getBilling(userId)).kind === "paid";
}
