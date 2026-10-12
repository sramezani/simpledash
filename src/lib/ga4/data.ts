import "server-only";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { after } from "next/server";
import { forgetGoogleToken } from "@/lib/auth/google";
import { db } from "@/lib/db/client";
import { reportCache, site as siteTable, type Site } from "@/lib/db/schema";
import { reportError } from "@/lib/report-error";
import {
  getReports,
  warmReports,
  type Audience,
  type CacheDeps,
  type CacheKey,
  type CacheRow,
} from "./cache";
import { runReportBatch } from "./clients";
import type { RangeType } from "./ranges";
import type { ReportName } from "./reports";

/** The cache wired to Postgres, GA4 and `after()`. Pages, the email and jobs use these functions. */

const keyMatch = (keys: CacheKey[]) =>
  or(
    ...keys.map((k) =>
      and(eq(reportCache.report, k.report), eq(reportCache.paramsHash, k.paramsHash)),
    ),
  );

export const cacheDeps: CacheDeps = {
  store: {
    async read(propertyId, rangeType, keys) {
      if (keys.length === 0) return [];
      const rows = await db
        .select()
        .from(reportCache)
        .where(
          and(
            eq(reportCache.propertyId, propertyId),
            eq(reportCache.rangeType, rangeType),
            keyMatch(keys),
          ),
        );
      return rows.map((r) => ({ ...r, report: r.report as ReportName }));
    },
    async upsert(propertyId, rangeType, rows: CacheRow[]) {
      if (rows.length === 0) return;
      await db
        .insert(reportCache)
        .values(
          rows.map((r) => ({
            ...r,
            propertyId,
            rangeType,
            refreshingUntil: null,
            lastError: null,
          })),
        )
        .onConflictDoUpdate({
          target: [
            reportCache.propertyId,
            reportCache.report,
            reportCache.rangeType,
            reportCache.paramsHash,
          ],
          set: {
            windowStart: sql`excluded.window_start`,
            windowEnd: sql`excluded.window_end`,
            payload: sql`excluded.payload`,
            fetchedAt: sql`excluded.fetched_at`,
            refreshingUntil: null,
            lastError: null,
          },
        });
    },
    async lease(propertyId, rangeType, keys) {
      if (keys.length === 0) return [];
      const leased = await db
        .update(reportCache)
        .set({ refreshingUntil: sql`now() + interval '30 seconds'` })
        .where(
          and(
            eq(reportCache.propertyId, propertyId),
            eq(reportCache.rangeType, rangeType),
            keyMatch(keys),
            or(isNull(reportCache.refreshingUntil), lt(reportCache.refreshingUntil, sql`now()`)),
          ),
        )
        .returning({ report: reportCache.report, paramsHash: reportCache.paramsHash });
      return leased.map((r) => ({ report: r.report as ReportName, paramsHash: r.paramsHash }));
    },
    async setError(propertyId, rangeType, keys, message) {
      if (keys.length === 0) return;
      await db
        .update(reportCache)
        .set({ lastError: message })
        .where(
          and(
            eq(reportCache.propertyId, propertyId),
            eq(reportCache.rangeType, rangeType),
            keyMatch(keys),
          ),
        );
    },
  },
  sites: {
    async markNeedsReconnect(userId) {
      forgetGoogleToken(userId);
      await db
        .update(siteTable)
        .set({ status: "needs_reconnect" })
        .where(eq(siteTable.userId, userId));
    },
    async markNoAccess(siteId) {
      await db.update(siteTable).set({ status: "no_access" }).where(eq(siteTable.id, siteId));
    },
    async blockQuota(siteId, until) {
      await db.update(siteTable).set({ quotaBlockedUntil: until }).where(eq(siteTable.id, siteId));
    },
  },
  fetchBatch: runReportBatch,
  schedule: (task) => after(task),
  logError: (message, error, context) => reportError(message, error, context),
};

/** Reports for a site and range, from cache first (docs/SPEC.md section 10.3). */
export function loadReports<R extends ReportName>(
  site: Site,
  rangeType: RangeType,
  names: readonly R[],
  options: { audience?: Audience; now?: Date; cacheOnly?: boolean } = {},
) {
  return getReports(site, rangeType, names, cacheDeps, options);
}

/** Fetches stale or missing reports now (jobs). */
export function warm(site: Site, rangeType: RangeType, names: readonly ReportName[]) {
  return warmReports(cacheDeps, site, rangeType, names);
}
