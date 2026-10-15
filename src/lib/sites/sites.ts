import "server-only";
import { and, desc, eq, isNotNull, isNull, lt, ne, or } from "drizzle-orm";
import { cache } from "react";
import { getPlan } from "@/lib/billing/billing";
import { entitlements, type Entitlements, type PlanState } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { site, type Site } from "@/lib/db/schema";
import { chooseSite, siteList } from "./access";

/** The user's sites in their list (added), plus the active one: everything a menu can show. */
export function getUserSites(userId: string): Promise<Site[]> {
  return db
    .select()
    .from(site)
    .where(and(eq(site.userId, userId), or(isNotNull(site.addedAt), eq(site.isActive, true))));
}

export type SiteContext = {
  plan: PlanState;
  ent: Entitlements;
  /** The list, in the order the sites were added. Every one of them opens. */
  sites: Site[];
  /** The site to show: the one in the address, or the active one. Null when it isn't theirs. */
  site: Site | null;
};

/**
 * Everything a signed-in page or action needs about sites, read once per request:
 * the plan, the list, and the site to show (the one in the address, or the active one).
 */
export const getSiteContext = cache(
  async (userId: string, requested: string | null = null): Promise<SiteContext> => {
    const [plan, rows] = await Promise.all([getPlan(userId), getUserSites(userId)]);
    const ent = entitlements(plan);
    return {
      plan,
      ent,
      sites: siteList(rows),
      site: chooseSite(rows, requested),
    };
  },
);

const HOUR = 60 * 60 * 1000;

/**
 * The dashboard opened a site: it becomes the active one (the dashboard opens with it
 * next time) and its `last_viewed_at` is stamped, at most once an hour, for warm-cache.
 * Run after the response, so opening a page never waits for it.
 */
export async function markSiteOpened(opened: Site, now: Date = new Date()) {
  if (!opened.isActive) {
    await db.transaction(async (tx) => {
      await tx
        .update(site)
        .set({ isActive: false })
        .where(
          and(eq(site.userId, opened.userId), eq(site.isActive, true), ne(site.id, opened.id)),
        );
      await tx.update(site).set({ isActive: true }).where(eq(site.id, opened.id));
    });
  }
  await db
    .update(site)
    .set({ lastViewedAt: now })
    .where(
      and(
        eq(site.id, opened.id),
        or(isNull(site.lastViewedAt), lt(site.lastViewedAt, new Date(now.getTime() - HOUR))),
      ),
    );
}

/**
 * Takes a site off the user's list (Settings). Its notes and settings stay, so
 * opening it again restores them, and its public page pauses. The last site can't go.
 */
export async function removeSite(
  userId: string,
  siteId: string,
): Promise<{ ok: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const listed = await tx
      .select()
      .from(site)
      .where(and(eq(site.userId, userId), isNotNull(site.addedAt)))
      .orderBy(desc(site.addedAt));
    const target = listed.find((s) => s.id === siteId);
    if (!target) return { error: "That site isn't in your list." };
    if (listed.length <= 1)
      return { error: "Your last site can't be removed. Open another first." };
    await tx.update(site).set({ addedAt: null, isActive: false }).where(eq(site.id, siteId));
    if (target.isActive) {
      // The most recently added of the others becomes the one the dashboard opens with.
      const next = listed.find((s) => s.id !== siteId)!;
      await tx.update(site).set({ isActive: true }).where(eq(site.id, next.id));
    }
    return { ok: true };
  });
}
