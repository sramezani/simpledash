import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { site } from "@/lib/db/schema";

/** After a successful sign-in or token refresh, sites waiting for a reconnect work again. */
export async function reactivateSites(userId: string) {
  await db
    .update(site)
    .set({ status: "ok" })
    .where(and(eq(site.userId, userId), eq(site.status, "needs_reconnect")));
}

/** Access to the property is back (it was "no_access"). */
export async function markSiteOk(siteId: string) {
  await db.update(site).set({ status: "ok" }).where(eq(site.id, siteId));
}
