import type { Route } from "next";
import Link from "next/link";
import type { OverviewMetric } from "@/components/cards/overview-card";
import { formatDate, formatMoney, formatNumber, percentChange } from "@/lib/format";
import type { RevenueView } from "@/lib/revenue/revenue";
import { visitorsPerCustomer } from "@/lib/revenue/totals";

const linkClass =
  "inline-flex h-9 items-center self-start rounded-lg border border-dashed px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-muted pointer-coarse:h-11";

/**
 * The overview's Revenue and New customers (docs/SPEC.md section 28.3), from Stripe's
 * stored daily totals. Before Stripe is connected, Revenue asks for it instead.
 */
export function revenueMetrics({
  view,
  visitors,
  comparable,
  settingsHref,
}: {
  view: RevenueView;
  /** Visitors in the same days, for "1 per 412 visitors". */
  visitors: number | null;
  /** False when the period can't be compared at all (today, not enough history). */
  comparable: boolean;
  settingsHref: string;
}): OverviewMetric[] {
  if (view.kind === "none") {
    return [
      {
        id: "revenue",
        value: null,
        change: null,
        children: (
          <Link href={settingsHref as Route} className={linkClass}>
            Connect Stripe
          </Link>
        ),
      },
    ];
  }
  if (view.kind === "syncing" || view.kind === "invalid") {
    return [
      {
        id: "revenue",
        value: null,
        change: null,
        note:
          view.kind === "syncing" ? (
            "Reading your Stripe totals…"
          ) : (
            <Link
              href={settingsHref as Route}
              className="text-destructive underline-offset-2 hover:underline"
            >
              Stripe stopped accepting the key (…{view.keyHint})
            </Link>
          ),
      },
    ];
  }
  const { current, previous } = view;
  const since = `Stripe totals start ${formatDate(new Date(`${view.coversFrom}T12:00:00Z`))}`;
  const missing = previous ? undefined : since;
  const change = (now: number, before: number | undefined) =>
    comparable && before !== undefined ? percentChange(now, before) : null;
  const perCustomer =
    visitors === null ? null : visitorsPerCustomer(visitors, current.newCustomers);
  const mrr = view.mrr?.amounts[current.currency];
  const others = current.others
    .filter((o) => o.revenue !== 0)
    .map((o) => formatMoney(o.revenue, o.currency))
    .join(", ");
  return [
    {
      id: "revenue",
      value: formatMoney(current.revenue, current.currency),
      change: change(current.revenue, previous?.revenue),
      missing,
      note:
        [
          mrr !== undefined
            ? `MRR ${formatMoney(mrr, current.currency)}${view.mrrLeftOut > 0 ? ` (${view.mrrLeftOut} usage-based not counted)` : ""}`
            : null,
          current.refunded > 0
            ? `after ${formatMoney(current.refunded, current.currency)} refunds`
            : null,
          others ? `plus ${others}` : null,
          view.livemode ? null : "test mode",
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
    },
    {
      id: "customers",
      value: formatNumber(current.newCustomers),
      change: change(current.newCustomers, previous?.newCustomers),
      missing,
      note: perCustomer !== null ? `1 per ${formatNumber(perCustomer)} visitors` : undefined,
    },
  ];
}
