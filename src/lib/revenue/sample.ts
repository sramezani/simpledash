import { addDays, daysIn, type DateRange } from "@/lib/ga4/ranges";
import type { RevenueView } from "./revenue";
import { periodRevenue, type StoredDay } from "./totals";

/**
 * Sample Stripe totals for the dev previews: a small SaaS on €19 and €190 plans,
 * deterministic per day. Built with the real totals functions.
 */
function sampleDays(range: DateRange): StoredDay[] {
  return Array.from({ length: daysIn(range) }, (_, i) => {
    const day = addDays(range.start, i);
    const n = Number(day.replaceAll("-", "")) % 97;
    const sales = n % 5 === 0 ? 0 : 1 + (n % 4);
    const yearly = n % 11 === 0 ? 1 : 0;
    return {
      day,
      money: {
        EUR: { charged: sales * 1900 + yearly * 19000, refunded: n % 23 === 0 ? 1900 : 0 },
      },
      newCustomers: n % 3 === 0 ? 2 : n % 2,
      mrr: null,
    };
  });
}

export function sampleRevenue(periods: { current: DateRange; previous: DateRange }): RevenueView {
  const days = sampleDays({ start: periods.previous.start, end: periods.current.end });
  return {
    kind: "ready",
    current: periodRevenue(days, periods.current, "EUR"),
    previous: periodRevenue(days, periods.previous, "EUR"),
    mrr: { day: periods.current.end, amounts: { EUR: 241_900 } },
    mrrLeftOut: 0,
    livemode: true,
    coversFrom: addDays(periods.previous.start, -400),
    lastSyncAt: null,
  };
}
