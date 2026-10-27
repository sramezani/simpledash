import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { site, type Site } from "@/lib/db/schema";
import { runSingleReport, withAdminClient } from "./clients";
import {
  enumIs,
  hostnameFromUri,
  mapLimit,
  pickBusiest,
  toDate,
  type PropertySummary,
} from "./property-choice";

export type { PropertySummary };

const ADMIN_TIMEOUT = { timeout: 15_000, retry: null } as const;
const MAX_CHECKED = 20;

/** Every ordinary GA4 property the user can read, following every page. */
export function listProperties(userId: string): Promise<PropertySummary[]> {
  return withAdminClient(userId, async (client) => {
    const out: PropertySummary[] = [];
    let pageToken: string | undefined;
    do {
      const [accounts, , raw] = await client.listAccountSummaries(
        { pageSize: 200, pageToken },
        { ...ADMIN_TIMEOUT, autoPaginate: false },
      );
      for (const acc of accounts) {
        for (const p of acc.propertySummaries ?? []) {
          const ordinary = !p.propertyType || enumIs(p.propertyType, "PROPERTY_TYPE_ORDINARY", 1);
          if (p.property && ordinary) {
            out.push({
              propertyId: p.property,
              displayName: p.displayName || p.property,
              account: acc.displayName ?? "",
            });
          }
        }
      }
      pageToken = raw?.nextPageToken || undefined;
    } while (pageToken);
    return out;
  });
}

async function visitorsLast7Days(userId: string, propertyId: string): Promise<number | null> {
  try {
    const res = await runSingleReport(
      userId,
      propertyId,
      {
        dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
        metrics: [{ name: "activeUsers" }],
      },
      5_000,
    );
    return Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  } catch {
    return null;
  }
}

/**
 * Picks a property without asking (docs/SPEC.md section 7): the only one, or the
 * one with the most visitors in the last 7 days among the first 20. Returns null
 * when the account has no GA4 property.
 */
export async function chooseProperty(userId: string): Promise<Site | null> {
  const properties = await listProperties(userId);
  if (properties.length === 0) return null;
  let chosen = properties[0]!;
  if (properties.length > 1) {
    const candidates = properties.slice(0, MAX_CHECKED);
    const counts = await mapLimit(candidates, 5, (p) => visitorsLast7Days(userId, p.propertyId));
    chosen = candidates[pickBusiest(counts)]!;
  }
  return connectProperty(userId, chosen.propertyId);
}

/**
 * Fetches the property's details, adds it to the user's list (docs/SPEC.md section 28.1:
 * no limit on any plan) and makes it the active site. A site already in the list just
 * becomes active, and one that left the list comes back with its notes and settings.
 */
export async function connectProperty(userId: string, propertyId: string): Promise<Site> {
  const [[property], [streams]] = await withAdminClient(userId, (client) =>
    Promise.all([
      client.getProperty({ name: propertyId }, ADMIN_TIMEOUT),
      client.listDataStreams(
        { parent: propertyId, pageSize: 50 },
        { ...ADMIN_TIMEOUT, autoPaginate: false },
      ),
    ]),
  );
  const web = streams.find((s) => enumIs(s.type, "WEB_DATA_STREAM", 1));
  const values = {
    displayName: property.displayName || propertyId,
    domain: hostnameFromUri(web?.webStreamData?.defaultUri),
    timeZone: property.timeZone || "UTC",
    currencyCode: property.currencyCode || "USD",
    serviceLevel: enumIs(property.serviceLevel, "GOOGLE_ANALYTICS_360", 2)
      ? "GOOGLE_ANALYTICS_360"
      : "GOOGLE_ANALYTICS_STANDARD",
    propertyCreatedAt: toDate(property.createTime),
  };

  return db.transaction(async (tx) => {
    // One change to a user's list at a time, so two quick clicks can't leave two active sites.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sites:${userId}`}))`);
    await tx
      .update(site)
      .set({ isActive: false })
      .where(and(eq(site.userId, userId), eq(site.isActive, true)));
    const [row] = await tx
      .insert(site)
      .values({
        id: crypto.randomUUID(),
        userId,
        propertyId,
        isActive: true,
        status: "ok",
        addedAt: new Date(),
        ...values,
      })
      // Coming back keeps the site's notes, signup event and settings.
      .onConflictDoUpdate({
        target: [site.userId, site.propertyId],
        set: {
          ...values,
          isActive: true,
          status: "ok",
          addedAt: sql`coalesce(${site.addedAt}, excluded.added_at)`,
        },
      })
      .returning();
    return row!;
  });
}

/** The site menu: opens a site, after checking it is in the user's own Google list. */
export async function addProperty(userId: string, propertyId: string): Promise<Site> {
  await assertInGoogleList(userId, propertyId);
  return connectProperty(userId, propertyId);
}

async function assertInGoogleList(userId: string, propertyId: string) {
  const properties = await listProperties(userId);
  if (!properties.some((p) => p.propertyId === propertyId)) {
    throw new Error("That property isn't in your Google account");
  }
}

const accessCheckedAt = new Map<string, number>();

/**
 * Whether the user can read the property again (to clear a "lost access" state).
 * Asks Google at most every 10 minutes per site, so refreshing the page stays fast.
 */
export async function stillHasAccess(userId: string, propertyId: string): Promise<boolean> {
  const key = `${userId}|${propertyId}`;
  const last = accessCheckedAt.get(key);
  if (last && Date.now() - last < 10 * 60_000) return false;
  accessCheckedAt.set(key, Date.now());
  const properties = await listProperties(userId);
  const back = properties.some((p) => p.propertyId === propertyId);
  if (back) accessCheckedAt.delete(key);
  return back;
}

// Accounts with no GA4 property are checked again after 5 minutes, not on every page view.
const noPropertyUntil = new Map<string, number>();

/** First visit: picks a property, remembering briefly when there is none. */
export async function chooseFirstSite(userId: string): Promise<Site | null> {
  const until = noPropertyUntil.get(userId);
  if (until && until > Date.now()) return null;
  const chosen = await chooseProperty(userId);
  if (chosen) noPropertyUntil.delete(userId);
  else noPropertyUntil.set(userId, Date.now() + 5 * 60_000);
  return chosen;
}

const keyEventCache = new Map<string, { names: string[]; at: number }>();

/**
 * The property's key events (Admin API), for the "Which action means a signup?" picker.
 * Kept for 10 minutes, so the dashboard doesn't ask Google on every view.
 */
export async function listKeyEventNames(
  userId: string,
  propertyId: string,
  fresh = false,
): Promise<string[]> {
  const cached = keyEventCache.get(propertyId);
  if (!fresh && cached && Date.now() - cached.at < 10 * 60_000) return cached.names;
  const [events] = await withAdminClient(userId, (client) =>
    client.listKeyEvents(
      { parent: propertyId, pageSize: 200 },
      { ...ADMIN_TIMEOUT, autoPaginate: false },
    ),
  );
  const names = [...new Set(events.map((e) => e.eventName).filter((n): n is string => !!n))].sort();
  keyEventCache.set(propertyId, { names, at: Date.now() });
  return names;
}
