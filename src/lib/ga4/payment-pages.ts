/**
 * Payment pages that show up as a "source" (docs/SPEC.md section 28.3): when buyers
 * come back from paying, GA4 starts a new session from the payment page, so the sale
 * gets that page as its source instead of the real one. Pure, so it is tested.
 */
export const PAYMENT_PAGES = [
  "checkout.stripe.com",
  "pay.stripe.com",
  "billing.stripe.com",
  "paypal.com",
  "checkout.paddle.com",
  "buy.paddle.com",
  "lemonsqueezy.com",
  "polar.sh",
] as const;

/** Google's help on "List unwanted referrals". */
export const UNWANTED_REFERRALS_HELP = "https://support.google.com/analytics/answer/10327750";

/** The payment pages among a period's sources (with visitors), as GA4 names them. */
export function paymentReferrers(rows: { source: string; visitors: number }[]): string[] {
  return rows
    .filter((r) => r.visitors > 0)
    .map((r) => r.source.toLowerCase().replace(/^www\./, ""))
    .filter((host) => PAYMENT_PAGES.some((p) => host === p || host.endsWith(`.${p}`)));
}
