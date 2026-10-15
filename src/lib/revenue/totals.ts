import { addDays, daysIn, todayIn, type DateRange } from "@/lib/ga4/ranges";

/**
 * Revenue from Stripe as daily totals (docs/SPEC.md section 28.3). Pure, so it is
 * tested. Amounts are in each currency's smallest unit (cents); nothing per customer
 * is kept.
 */

/** What a pasted key is. Only restricted keys are accepted. */
export type KeyKind = "restricted_live" | "restricted_test" | "secret" | "publishable" | "invalid";

export function keyKind(key: string): KeyKind {
  const k = key.trim();
  if (/^rk_live_[A-Za-z0-9]{20,}$/.test(k)) return "restricted_live";
  if (/^rk_test_[A-Za-z0-9]{20,}$/.test(k)) return "restricted_test";
  if (/^sk_(live|test)_/.test(k)) return "secret";
  if (/^pk_(live|test)_/.test(k)) return "publishable";
  return "invalid";
}

export type Money = Record<string, { charged: number; refunded: number }>;
export type DayTotals = { money: Money; newCustomers: number };

/** Stripe's objects, reduced to what's needed: amounts, currencies and times. */
export type StripeReads = {
  charges: { created: number; amount: number; currency: string }[];
  refunds: { created: number; amount: number; currency: string }[];
  customers: { created: number }[];
};

/** Each day's totals, in the site's time zone. */
export function bucketDays(reads: StripeReads, timeZone: string): Map<string, DayTotals> {
  const days = new Map<string, DayTotals>();
  const day = (created: number) => {
    const key = todayIn(timeZone, new Date(created * 1000));
    const found = days.get(key) ?? { money: {}, newCustomers: 0 };
    days.set(key, found);
    return found;
  };
  const money = (d: DayTotals, currency: string) => {
    const cur = currency.toUpperCase();
    return (d.money[cur] ??= { charged: 0, refunded: 0 });
  };
  for (const c of reads.charges) money(day(c.created), c.currency).charged += c.amount;
  for (const r of reads.refunds) money(day(r.created), r.currency).refunded += r.amount;
  for (const c of reads.customers) day(c.created).newCustomers++;
  return days;
}

/** A subscription item, reduced to its price. */
export type SubItem = {
  unitAmount: number | null;
  currency: string;
  interval: "day" | "week" | "month" | "year" | null;
  intervalCount: number;
  quantity: number;
};

/** One item's monthly amount: yearly ÷ 12, weekly × 52 ÷ 12. Null for a usage-based price. */
export function monthlyAmount(item: SubItem): number | null {
  if (item.unitAmount === null || item.interval === null) return null;
  const total = item.unitAmount * item.quantity;
  const count = Math.max(1, item.intervalCount);
  const perMonth: Record<NonNullable<SubItem["interval"]>, number> = {
    day: 365 / 12,
    week: 52 / 12,
    month: 1,
    year: 1 / 12,
  };
  return (total * perMonth[item.interval]) / count;
}

/**
 * Monthly recurring revenue: the monthly list price of every active and past-due
 * subscription, before discounts, per currency. Subscriptions with a usage-based price
 * can't be counted exactly, so they're counted as left out instead.
 */
export function mrr(subscriptions: { status: string; items: SubItem[] }[]): {
  amounts: Record<string, number>;
  leftOut: number;
} {
  const amounts: Record<string, number> = {};
  let leftOut = 0;
  for (const sub of subscriptions) {
    if (sub.status !== "active" && sub.status !== "past_due") continue;
    const monthly = sub.items.map(monthlyAmount);
    if (monthly.some((m) => m === null)) {
      leftOut++;
      continue;
    }
    sub.items.forEach((item, i) => {
      const cur = item.currency.toUpperCase();
      amounts[cur] = (amounts[cur] ?? 0) + monthly[i]!;
    });
  }
  for (const cur of Object.keys(amounts)) amounts[cur] = Math.round(amounts[cur]!);
  return { amounts, leftOut };
}

export type StoredDay = {
  day: string;
  money: Money;
  newCustomers: number;
  mrr: Record<string, number> | null;
};

export type PeriodRevenue = {
  /** The currency with the most charged in the period (or the account's usual one). */
  currency: string;
  /** Charged minus refunded, in that currency. */
  revenue: number;
  charged: number;
  refunded: number;
  newCustomers: number;
  /** Money in other currencies, never converted: named next to the number. */
  others: { currency: string; revenue: number }[];
  /** Revenue per day in the main currency, for the bars. */
  byDay: Map<string, number>;
};

/** Whether the stored totals cover a period: from the first synced day through its end. */
export function covers(coversFrom: string | null, range: DateRange): boolean {
  return coversFrom !== null && coversFrom <= range.start;
}

/** Totals for a period from the stored days (days without a row had nothing). */
export function periodRevenue(
  days: StoredDay[],
  range: DateRange,
  preferred?: string,
): PeriodRevenue {
  const inRange = days.filter((d) => d.day >= range.start && d.day <= range.end);
  const sums: Money = {};
  let newCustomers = 0;
  for (const d of inRange) {
    newCustomers += d.newCustomers;
    for (const [cur, m] of Object.entries(d.money)) {
      const s = (sums[cur] ??= { charged: 0, refunded: 0 });
      s.charged += m.charged;
      s.refunded += m.refunded;
    }
  }
  const currencies = Object.keys(sums).sort((a, b) => sums[b]!.charged - sums[a]!.charged);
  const currency = currencies[0] ?? preferred ?? "EUR";
  const main = sums[currency] ?? { charged: 0, refunded: 0 };
  const byDay = new Map<string, number>();
  for (const d of inRange) {
    const m = d.money[currency];
    if (m) byDay.set(d.day, m.charged - m.refunded);
  }
  return {
    currency,
    revenue: main.charged - main.refunded,
    charged: main.charged,
    refunded: main.refunded,
    newCustomers,
    others: currencies
      .filter((c) => c !== currency)
      .map((c) => ({ currency: c, revenue: sums[c]!.charged - sums[c]!.refunded })),
    byDay,
  };
}

/** The newest recorded MRR on or before a day, and when it was recorded. */
export function latestMrr(
  days: StoredDay[],
  until: string,
): { day: string; amounts: Record<string, number> } | null {
  const recorded = days
    .filter((d) => d.mrr && d.day <= until)
    .sort((a, b) => (a.day < b.day ? 1 : -1));
  const latest = recorded[0];
  return latest ? { day: latest.day, amounts: latest.mrr! } : null;
}

/** The first day to read again on a sync: two days before the last one, so late refunds land. */
export function syncFrom(lastSyncAt: Date | null, backfillFrom: string, timeZone: string): string {
  if (!lastSyncAt) return backfillFrom;
  const last = todayIn(timeZone, lastSyncAt);
  const from = addDays(last, -2);
  return from > backfillFrom ? from : backfillFrom;
}

/** How far back the first sync reads: 25 months, enough for 12 months against the 12 before. */
export function backfillStart(today: string): string {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(y, m - 1 - 25, 1));
  return date.toISOString().slice(0, 10);
}

/** "1 per 412 visitors": visitors for each new customer in the same days, or null. */
export function visitorsPerCustomer(visitors: number, newCustomers: number): number | null {
  return newCustomers > 0 ? Math.round(visitors / newCustomers) : null;
}

/** Days in a range, for the bars' empty days. */
export const rangeDays = (range: DateRange) =>
  Array.from({ length: daysIn(range) }, (_, i) => addDays(range.start, i));
