import "server-only";
import { lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reportCache, session, verification } from "@/lib/db/schema";

const DAY = 24 * 60 * 60 * 1000;

/** Daily at 03:30 UTC: old report caches, expired sessions and sign-in leftovers. */
export async function cleanupJob(now: Date = new Date()) {
  const caches = await db
    .delete(reportCache)
    .where(lt(reportCache.fetchedAt, new Date(now.getTime() - 7 * DAY)))
    .returning({ id: reportCache.propertyId });
  const sessions = await db
    .delete(session)
    .where(lt(session.expiresAt, now))
    .returning({ id: session.id });
  const verifications = await db
    .delete(verification)
    .where(lt(verification.expiresAt, now))
    .returning({ id: verification.id });
  return { caches: caches.length, sessions: sessions.length, verifications: verifications.length };
}
