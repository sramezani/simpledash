import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { lazyObject } from "@/lib/lazy";
import type { PlanPrices } from "./webhook";

/** The Stripe client, created on first use (a build needs no Stripe key). */
const createStripe = () =>
  new Stripe(env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20_000 });
export const stripe: ReturnType<typeof createStripe> = lazyObject(createStripe);

/** The four price IDs: two per plan (docs/SPEC.md section 28.1). */
export const planPrices = (): PlanPrices => ({
  starter: { month: env.STRIPE_PRICE_MONTHLY, year: env.STRIPE_PRICE_YEARLY },
  growth: { month: env.STRIPE_PRICE_GROWTH_MONTHLY, year: env.STRIPE_PRICE_GROWTH_YEARLY },
});
