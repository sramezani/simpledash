import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import Stripe from "stripe";
import { revokeGoogleAccess } from "@/lib/auth/google";
import { stripe } from "@/lib/billing/stripe";
import { db } from "@/lib/db/client";
import { account, billing, publicPage, reportCache, session, site, user } from "@/lib/db/schema";
import { reportError } from "@/lib/report-error";

/** Deletes cached reports for these properties unless another user's site still uses them. */
async function deleteUnusedCaches(propertyIds: string[], userId: string) {
  if (propertyIds.length === 0) return;
  const shared = await db
    .selectDistinct({ propertyId: site.propertyId })
    .from(site)
    .where(and(inArray(site.propertyId, propertyIds), ne(site.userId, userId)));
  const unused = propertyIds.filter((p) => !shared.some((s) => s.propertyId === p));
  if (unused.length > 0)
    await db.delete(reportCache).where(inArray(reportCache.propertyId, unused));
}

async function propertyIdsOf(userId: string) {
  const rows = await db
    .select({ propertyId: site.propertyId })
    .from(site)
    .where(eq(site.userId, userId));
  return [...new Set(rows.map((r) => r.propertyId))];
}

/** The user's public pages' slugs (one per site), so their cached copies can be dropped. */
export async function publicSlugsOf(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: publicPage.slug })
    .from(publicPage)
    .where(eq(publicPage.userId, userId));
  return rows.map((r) => r.slug);
}

/**
 * Disconnect Google (docs/SPEC.md section 6): revoke the grant, clear the tokens,
 * drop caches nobody else needs and end every session. Settings, notes, the signup
 * event and the public page's slug stay, so signing in again restores everything.
 */
export async function disconnectGoogle(userId: string) {
  await revokeGoogleAccess(userId);
  await db
    .update(account)
    .set({
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    })
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")));
  await db.update(site).set({ status: "needs_reconnect" }).where(eq(site.userId, userId));
  await deleteUnusedCaches(await propertyIdsOf(userId), userId);
  await db.delete(session).where(eq(session.userId, userId));
}

/** Cancels the Stripe subscription now. True when nothing is left running at Stripe. */
async function cancelSubscription(userId: string): Promise<boolean> {
  const row = await db.query.billing.findFirst({ where: eq(billing.userId, userId) });
  const id = row?.stripeSubscriptionId;
  if (!id || row.status === "canceled" || row.status === "incomplete_expired") return true;
  try {
    await stripe.subscriptions.cancel(id);
    return true;
  } catch (error) {
    // Already gone or already cancelled at Stripe: nothing left to stop. Anything
    // else (including a failed check) keeps the account, so nobody is charged by surprise.
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      if (error.code === "resource_missing") return true;
      try {
        const current = await stripe.subscriptions.retrieve(id);
        if (current.status === "canceled" || current.status === "incomplete_expired") return true;
      } catch (retrieveError) {
        reportError("Checking the subscription failed", retrieveError, { userId });
        return false;
      }
    }
    reportError("Cancelling the subscription failed", error, { userId });
    return false;
  }
}

/**
 * Delete account (docs/SPEC.md section 6): cancel any subscription, revoke Google,
 * delete the user (every table cascades) and caches nobody else needs.
 * Stripe keeps its own payment records, as the merchant of record.
 */
export async function deleteAccount(userId: string): Promise<{ ok: true } | { error: string }> {
  if (!(await cancelSubscription(userId))) {
    return {
      error:
        "We couldn't cancel your subscription with Stripe, so nothing was deleted. Please try again in a minute.",
    };
  }
  await revokeGoogleAccess(userId);
  const propertyIds = await propertyIdsOf(userId);
  await db.delete(user).where(eq(user.id, userId));
  await deleteUnusedCaches(propertyIds, userId);
  return { ok: true };
}
