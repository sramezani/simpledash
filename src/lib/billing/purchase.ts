import type { BillingInterval } from "@/config/plans";
import type { Purchase } from "@/lib/analytics/events";
import { currencyDigits } from "@/lib/format";

/** The parts of a Stripe Checkout Session the purchase event needs. */
export type CheckoutSessionLike = {
  id: string;
  client_reference_id: string | null;
  status: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  total_details?: { amount_tax?: number | null } | null;
  metadata?: Record<string, string> | null;
};

/**
 * The purchase for SimpleDash's own analytics, from the Checkout Session Stripe returned to
 * the dashboard: only the signed-in user's own session, complete and paid, with Stripe's
 * amounts (before tax, and the tax). Null otherwise. Pure, so it is tested.
 */
export function purchaseFromSession(session: CheckoutSessionLike, userId: string): Purchase | null {
  if (session.client_reference_id !== userId) return null;
  if (session.status !== "complete" || session.payment_status !== "paid") return null;
  if (session.amount_total === null || !session.currency) return null;
  const currency = session.currency.toUpperCase();
  const unit = 10 ** currencyDigits(currency);
  const tax = session.total_details?.amount_tax ?? 0;
  const interval = session.metadata?.interval;
  return {
    transactionId: session.id,
    value: (session.amount_total - tax) / unit,
    tax: tax / unit,
    currency,
    interval: interval === "month" || interval === "year" ? (interval as BillingInterval) : null,
  };
}
