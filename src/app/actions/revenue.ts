"use server";

import type { Route } from "next";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { requireSite } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { site as siteTable } from "@/lib/db/schema";
import { listKeyEventNames } from "@/lib/ga4/properties";
import {
  getRevenueSource,
  removeRevenue,
  saveRevenueKey,
  syncRevenue,
} from "@/lib/revenue/revenue";
import { checkKey, RESOURCE_NAMES } from "@/lib/revenue/stripe-reader";
import { keyKind } from "@/lib/revenue/totals";
import { reportError } from "@/lib/report-error";
import { getSiteContext } from "@/lib/sites/sites";

/**
 * Revenue and sales for one site (docs/SPEC.md section 28.3), Growth only. Each action
 * is bound to a site ID on the page; `requireSite` checks it's the user's own.
 */

async function requireRevenueSite(siteId: string) {
  const found = await requireSite(siteId);
  const { ent } = await getSiteContext(found.user.id);
  if (!ent.revenue) redirect(`/settings?site=${siteId}#revenue` as Route);
  return found;
}

export type StripeKeyState = { saved?: boolean; error?: string } | null;

/** "Check and save": only restricted keys, checked with one read of each resource. */
export async function saveStripeKeyAction(
  siteId: string,
  _state: StripeKeyState,
  formData: FormData,
): Promise<StripeKeyState> {
  const { site } = await requireRevenueSite(siteId);
  const raw = formData.get("key");
  const key = typeof raw === "string" ? raw.trim() : "";
  switch (keyKind(key)) {
    case "secret":
      return {
        error:
          "That's a secret key (sk_…), which can change your Stripe account. Please create a restricted key (rk_…) with read access only.",
      };
    case "publishable":
      return { error: "That's a publishable key (pk_…). We need a restricted key (rk_…)." };
    case "invalid":
      return {
        error:
          "That doesn't look like a Stripe restricted key. It starts with rk_live_ or rk_test_.",
      };
  }
  const check = await checkKey(key);
  if (!check.ok) {
    if (check.problem === "permission") {
      return {
        error: `This key can't read ${RESOURCE_NAMES[check.missing]}. In Stripe, edit the key and set ${RESOURCE_NAMES[check.missing]} to Read, then try again.`,
      };
    }
    return {
      error:
        check.problem === "invalid"
          ? "Stripe doesn't accept this key. It may have been deleted or mistyped."
          : "Stripe didn't answer. Please try again in a moment.",
    };
  }
  await saveRevenueKey(site, key, check.livemode);
  // The first sync reads 25 months, so it runs after the response.
  after(async () => {
    const source = await getRevenueSource(site.id);
    if (source)
      await syncRevenue(site, source).catch((e) =>
        reportError("First revenue sync failed", e, { siteId: site.id }),
      );
  });
  refresh();
  return { saved: true };
}

/** "Remove": deletes the key and every stored total for the site. */
export async function removeStripeAction(siteId: string) {
  const { site } = await requireRevenueSite(siteId);
  await removeRevenue(site.id);
  redirect(`/settings?site=${site.id}&revenue=removed#revenue` as Route);
}

const PAGE = /^\/[^\s?#]{0,200}$/;

/** "What counts as a sale?": a key event, a thank-you page, or nothing. */
export async function saveSaleAction(siteId: string, formData: FormData) {
  const { user, site } = await requireRevenueSite(siteId);
  const kind = formData.get("kind");
  let saleEvent: string | null = null;
  let salePage: string | null = null;
  let result = "saved";
  if (kind === "event") {
    const event = formData.get("event");
    const keyEvents =
      typeof event === "string"
        ? await listKeyEventNames(user.id, site.propertyId, true).catch(() => null)
        : null;
    if (!keyEvents) result = "google";
    else if (!keyEvents.includes(event as string)) result = "not_key_event";
    else saleEvent = event as string;
  } else if (kind === "page") {
    const page = formData.get("page");
    const path = typeof page === "string" ? page.trim() : "";
    if (PAGE.test(path)) salePage = path.length > 1 ? path.replace(/\/+$/, "") : path;
    else result = "bad_page";
  }
  if (result === "saved") {
    await db.update(siteTable).set({ saleEvent, salePage }).where(eq(siteTable.id, site.id));
  }
  redirect(`/settings?site=${site.id}&sale=${result}#sales` as Route);
}
