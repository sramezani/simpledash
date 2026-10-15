import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { encryptSecret, decryptSecret } from "@/lib/auth/secrets";
import { db } from "@/lib/db/client";
import { revenueDay, revenueSource, type RevenueSource, type Site } from "@/lib/db/schema";
import { todayIn, type DateRange } from "@/lib/ga4/ranges";
import { reportError } from "@/lib/report-error";
import { readProblem, readSince, readSubscriptions } from "./stripe-reader";
import {
  backfillStart,
  bucketDays,
  covers,
  latestMrr,
  mrr,
  periodRevenue,
  syncFrom,
  type PeriodRevenue,
  type StoredDay,
} from "./totals";

/**
 * Revenue from Stripe for one site (docs/SPEC.md section 28.3): the stored key, the
 * sync into daily totals, and the numbers the dashboard shows.
 */

export function getRevenueSource(siteId: string): Promise<RevenueSource | undefined> {
  return db.query.revenueSource.findFirst({ where: eq(revenueSource.siteId, siteId) });
}

/** Saves a checked key, encrypted. Totals start again from the first sync. */
export async function saveRevenueKey(owned: Site, key: string, livemode: boolean) {
  const values = {
    secret: await encryptSecret(key),
    keyHint: key.slice(-4),
    livemode,
    status: "ok" as const,
    coversFrom: null,
    lastSyncAt: null,
    lastError: null,
    mrrLeftOut: 0,
    connectedAt: new Date(),
  };
  await db.transaction(async (tx) => {
    // A different key may be a different Stripe account: the old totals go.
    await tx.delete(revenueDay).where(eq(revenueDay.siteId, owned.id));
    await tx
      .insert(revenueSource)
      .values({ siteId: owned.id, userId: owned.userId, ...values })
      .onConflictDoUpdate({ target: revenueSource.siteId, set: values });
  });
}

/** "Remove": the key and every stored total for the site. */
export async function removeRevenue(siteId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(revenueDay).where(eq(revenueDay.siteId, siteId));
    await tx.delete(revenueSource).where(eq(revenueSource.siteId, siteId));
  });
}

/**
 * Reads Stripe since the last sync (from 2 days before it, or 25 months back the first
 * time) and replaces those days' totals. Earlier MRR snapshots are kept; today's is
 * recorded now.
 */
export async function syncRevenue(
  owned: Site,
  source: RevenueSource,
  now: Date = new Date(),
): Promise<"synced" | "invalid" | "unavailable"> {
  const key = await decryptSecret(source.secret);
  if (!key) {
    await db
      .update(revenueSource)
      .set({ status: "invalid", lastError: "The stored key can't be read" })
      .where(eq(revenueSource.siteId, owned.id));
    return "invalid";
  }
  const today = todayIn(owned.timeZone, now);
  const backfill = source.coversFrom ?? backfillStart(today);
  const from = syncFrom(source.lastSyncAt, backfill, owned.timeZone);
  // A little before midnight UTC of `from`, so every time zone's day is complete.
  const since = Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000) - 14 * 3600;
  let reads;
  let subscriptions;
  try {
    [reads, subscriptions] = await Promise.all([readSince(key, since), readSubscriptions(key)]);
  } catch (error) {
    const problem = readProblem(error);
    if (problem === "unavailable")
      reportError("Stripe revenue sync failed", error, { siteId: owned.id });
    await db
      .update(revenueSource)
      .set({
        ...(problem === "invalid" ? { status: "invalid" as const } : {}),
        lastError:
          problem === "invalid" ? "Stripe no longer accepts this key" : "Stripe didn't answer",
      })
      .where(eq(revenueSource.siteId, owned.id));
    return problem;
  }
  const days = bucketDays(reads, owned.timeZone);
  const snapshot = mrr(subscriptions);

  await db.transaction(async (tx) => {
    const kept = await tx
      .select({ day: revenueDay.day, mrr: revenueDay.mrr })
      .from(revenueDay)
      .where(and(eq(revenueDay.siteId, owned.id), gte(revenueDay.day, from)));
    const snapshots = new Map(kept.filter((k) => k.mrr).map((k) => [k.day, k.mrr]));
    snapshots.set(today, snapshot.amounts);
    await tx
      .delete(revenueDay)
      .where(and(eq(revenueDay.siteId, owned.id), gte(revenueDay.day, from)));
    const rows = new Map<string, typeof revenueDay.$inferInsert>();
    for (const [day, totals] of days) {
      if (day < from || day > today) continue;
      rows.set(day, {
        siteId: owned.id,
        day,
        money: totals.money,
        newCustomers: totals.newCustomers,
      });
    }
    for (const [day, amounts] of snapshots) {
      const row = rows.get(day) ?? { siteId: owned.id, day, money: {}, newCustomers: 0 };
      rows.set(day, { ...row, mrr: amounts });
    }
    if (rows.size > 0) await tx.insert(revenueDay).values([...rows.values()]);
    await tx
      .update(revenueSource)
      .set({
        status: "ok",
        coversFrom: backfill,
        lastSyncAt: now,
        lastError: null,
        mrrLeftOut: snapshot.leftOut,
      })
      .where(eq(revenueSource.siteId, owned.id));
  });
  return "synced";
}

export type RevenueView =
  | { kind: "none" }
  /** Connected, waiting for its first sync. */
  | { kind: "syncing" }
  | { kind: "invalid"; keyHint: string }
  | {
      kind: "ready";
      current: PeriodRevenue;
      /** Null when the totals don't reach back to the period before. */
      previous: PeriodRevenue | null;
      mrr: { day: string; amounts: Record<string, number> } | null;
      mrrLeftOut: number;
      livemode: boolean;
      /** The totals start here; a period starting earlier is only partly covered. */
      coversFrom: string;
      lastSyncAt: Date | null;
    };

/** The revenue numbers for a period and the one before, from the stored totals. */
export async function loadRevenue(
  owned: Site,
  periods: { current: DateRange; previous: DateRange },
): Promise<RevenueView> {
  const source = await getRevenueSource(owned.id);
  if (!source) return { kind: "none" };
  if (source.status === "invalid") return { kind: "invalid", keyHint: source.keyHint };
  if (!source.coversFrom) return { kind: "syncing" };
  const rows = await db
    .select()
    .from(revenueDay)
    .where(
      and(
        eq(revenueDay.siteId, owned.id),
        gte(revenueDay.day, periods.previous.start),
        lte(revenueDay.day, periods.current.end),
      ),
    );
  const days: StoredDay[] = rows.map((r) => ({
    day: r.day,
    money: r.money,
    newCustomers: r.newCustomers,
    mrr: r.mrr ?? null,
  }));
  const current = periodRevenue(days, periods.current, owned.currencyCode);
  const mrrRows = await db
    .select({ day: revenueDay.day, mrr: revenueDay.mrr })
    .from(revenueDay)
    .where(and(eq(revenueDay.siteId, owned.id), lte(revenueDay.day, periods.current.end)));
  return {
    kind: "ready",
    current,
    previous: covers(source.coversFrom, periods.previous)
      ? periodRevenue(days, periods.previous, current.currency)
      : null,
    mrr: latestMrr(
      mrrRows.map((r) => ({ day: r.day, money: {}, newCustomers: 0, mrr: r.mrr ?? null })),
      periods.current.end,
    ),
    mrrLeftOut: source.mrrLeftOut,
    livemode: source.livemode,
    coversFrom: source.coversFrom,
    lastSyncAt: source.lastSyncAt,
  };
}

/** True when the totals are older than an hour: the dashboard asks for a sync after the response. */
export function needsSync(source: Pick<RevenueSource, "lastSyncAt" | "status">, now = new Date()) {
  return (
    source.status === "ok" &&
    (!source.lastSyncAt || now.getTime() - source.lastSyncAt.getTime() > 60 * 60 * 1000)
  );
}
