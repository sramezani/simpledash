import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { lazyObject } from "@/lib/lazy";

/** The Stripe client, created on first use (a build needs no Stripe key). */
const createStripe = () =>
  new Stripe(env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20_000 });
export const stripe: ReturnType<typeof createStripe> = lazyObject(createStripe);

export const starterPrices = () => ({
  month: env.STRIPE_PRICE_MONTHLY,
  year: env.STRIPE_PRICE_YEARLY,
});
