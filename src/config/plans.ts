/**
 * Plans, prices and limits (docs/SPEC.md section 16). The only place they are written:
 * the pricing section, upgrade screens, settings, structured data, llms.txt, the terms
 * and every server-side limit read them from here. Prices are in US dollars, tax included.
 *
 * Free is for everyone, with no time limit and no card. Pro is the one paid plan.
 */
export const currency = "USD";
export const taxIncluded = true;

/** How far back Free can look: the last 30 days, and custom days inside them. */
export const FREE_HISTORY_DAYS = 30;

/** Sites have no limit on either plan: every Google Analytics site in the account (Siamak, Oct 15, 2026). */
export type PlanLimits = {
  /** 12 months and custom ranges of any length; Free sees the last 30 days. */
  fullHistory: boolean;
  /** The Monday email. */
  weeklyEmail: boolean;
  /** Google search insights from Search Console. */
  searchConsole: boolean;
  /** Revenue from Stripe, and sales and signups by source. */
  revenue: boolean;
  /** Public pages show "Powered by SimpleDash". */
  poweredBy: boolean;
};

type Plan = {
  id: string;
  name: string;
  prices: { month: number; year: number };
  summary: string;
  features: readonly string[];
  limits: PlanLimits;
};

export const plans = {
  free: {
    id: "free",
    name: "Free",
    prices: { month: 0, year: 0 },
    summary: "Your Google Analytics in plain words, for all your sites.",
    features: [
      "All your Google Analytics sites",
      "Today, 7 days and 30 days",
      "No traffic limits",
      "A public stats page",
    ],
    limits: {
      fullHistory: false,
      weeklyEmail: false,
      searchConsole: false,
      revenue: false,
      poweredBy: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    prices: { month: 9, year: 90 },
    summary: "Everything in Free, plus:",
    features: [
      "12 months and any dates",
      "The Monday email",
      "Google search insights",
      "Revenue from Stripe",
      "Sales and signups by source",
      "Your public page without our link",
    ],
    limits: {
      fullHistory: true,
      weeklyEmail: true,
      searchConsole: true,
      revenue: true,
      poweredBy: false,
    },
  },
} as const satisfies Record<string, Plan>;

export type PlanId = keyof typeof plans;
/** The plans someone pays for: one today. */
export type PaidPlanId = Exclude<PlanId, "free">;
export const paidPlanIds = ["pro"] as const satisfies readonly PaidPlanId[];

export type BillingInterval = keyof typeof plans.pro.prices;
export const billingIntervals = ["month", "year"] as const satisfies readonly BillingInterval[];
