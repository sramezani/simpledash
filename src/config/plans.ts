/**
 * Plans, prices and limits (docs/SPEC.md sections 16 and 28). The only place they
 * are written: the pricing section, upgrade screens, settings, structured data,
 * llms.txt, the terms and every server-side limit read them from here. Prices are
 * in euros, VAT included.
 */
export const plans = {
  starter: {
    id: "starter",
    name: "Starter",
    status: "on_sale",
    currency: "EUR",
    prices: { month: 9, year: 90 },
    trialDays: 14,
    summary: "Everything you need for one site.",
    features: [
      "One Google Analytics site",
      "No traffic limits",
      "Full history from day one",
      "The Monday email",
      "A public stats page",
    ],
    limits: { sites: 1, searchConsole: false, revenue: false },
  },
  growth: {
    id: "growth",
    name: "Growth",
    status: "on_sale",
    currency: "EUR",
    prices: { month: 19, year: 190 },
    summary: "Everything in Starter, plus:",
    features: [
      "Up to 10 sites, each with its own dashboard",
      "Google search insights",
      "Revenue from Stripe",
      "Sales and signups by source",
    ],
    limits: { sites: 10, searchConsole: true, revenue: true },
  },
} as const;

export const vatIncluded = true;

export type PlanId = keyof typeof plans;
export const planIds = ["starter", "growth"] as const satisfies readonly PlanId[];
export type PlanLimits = { sites: number; searchConsole: boolean; revenue: boolean };

export type BillingInterval = keyof typeof plans.starter.prices;
export const billingIntervals = ["month", "year"] as const satisfies readonly BillingInterval[];
