/**
 * Plans and prices (docs/SPEC.md section 16). The only place they are written:
 * the pricing section, upgrade screens, settings, structured data, llms.txt and
 * the terms all read them from here. Prices are in euros, VAT included.
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
  },
  growth: {
    id: "growth",
    name: "Growth",
    status: "coming_soon",
    currency: "EUR",
    // Shown on the pricing section only; not on sale yet.
    prices: { month: 19, year: 190 },
    summary: "Everything in Starter, plus:",
    features: [
      "Several sites",
      "Search Console searches",
      "Traffic alerts",
      "Mentions on the chart",
      "Revenue next to traffic",
      "Ask your data in plain English",
    ],
  },
} as const;

export const vatIncluded = true;

export type BillingInterval = keyof typeof plans.starter.prices;
export const billingIntervals = ["month", "year"] as const satisfies readonly BillingInterval[];
