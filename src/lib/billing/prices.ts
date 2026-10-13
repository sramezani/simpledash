import { plans, type BillingInterval } from "@/config/plans";
import { formatDate, formatPrice } from "@/lib/format";
import type { PlanState } from "./plan";

/** Months saved by paying yearly, worked out from the prices: (12 × 9 − 90) ÷ 9 = 2. Never typed by hand. */
export function monthsFreeOnYearly(
  prices: { month: number; year: number } = plans.starter.prices,
): number {
  return Math.round((12 * prices.month - prices.year) / prices.month);
}

/** "€9 a month" / "€90 a year". */
export function priceInWords(
  interval: BillingInterval,
  prices: { month: number; year: number } = plans.starter.prices,
): string {
  return `${formatPrice(prices[interval])} a ${interval}`;
}

/** "Yearly · 2 months free". */
export function yearlyLabel(): string {
  return `Yearly · ${monthsFreeLabel()}`;
}

/**
 * The plan in plain words for Settings → Billing (docs/SPEC.md section 16):
 * "Free trial · 9 days left", "Starter · €90 a year · renews on 11 Oct 2027",
 * "Growth · €19 a month · renews on 4 Nov 2026".
 */
export function planInWords(state: PlanState): string {
  if (state.kind === "trial") {
    return `Free trial · ${state.daysLeft} ${state.daysLeft === 1 ? "day" : "days"} left`;
  }
  if (state.kind === "locked") return `Free trial ended on ${formatDate(state.trialEndedAt)}`;
  const plan = plans[state.plan];
  const parts: string[] = [plan.name];
  if (state.interval) parts.push(priceInWords(state.interval, plan.prices));
  if (state.renewsAt) {
    parts.push(
      `${state.cancelAtPeriodEnd ? "ends on" : "renews on"} ${formatDate(state.renewsAt)}`,
    );
  }
  return parts.join(" · ");
}

/** "2 months free", for the note next to the Monthly / Yearly switch. */
export function monthsFreeLabel(
  prices: { month: number; year: number } = plans.starter.prices,
): string {
  const free = monthsFreeOnYearly(prices);
  return `${free} ${free === 1 ? "month" : "months"} free`;
}

/** What paying yearly saves: 12 × €9 − €90 = €18. */
export function yearlySaving(prices: { month: number; year: number }): number {
  return 12 * prices.month - prices.year;
}
