"use server";

import type { Route } from "next";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getGoogleAccount } from "@/lib/auth/google";
import { linkGoogleScope } from "@/lib/auth/link-scope";
import { hasSearchConsoleScope, SEARCH_CONSOLE_SCOPE } from "@/lib/auth/scopes";
import { requireSite } from "@/lib/auth/session";
import { todayIn } from "@/lib/ga4/ranges";
import { addSearchActionNote } from "@/lib/notes/notes";
import { searchActionNote } from "@/lib/search-console/action";
import { readBrandTerms } from "@/lib/search-console/brand";
import {
  autoConnect,
  chooseProperty,
  disconnectProperty,
  saveBrandTerms,
} from "@/lib/search-console/connect";
import { loadWeeklyPick } from "@/lib/search-console/data";
import { getSiteContext } from "@/lib/sites/sites";
import { settingsRoutes } from "@/lib/settings-routes";

/**
 * Google Search Console for one site (docs/SPEC.md section 28.2). Each action is
 * bound to a site ID on the page; `requireSite` checks it is the user's own and open
 * on their plan, and Search Console is Pro only.
 */

type Back = "dashboard" | "settings";

const backTo = (siteId: string, back: Back, result: string) =>
  (back === "dashboard"
    ? `/dashboard?site=${siteId}&search=${result}`
    : `/settings/sites/${siteId}?search=${result}#search`) as Route;

async function requireProSite(siteId: string) {
  const found = await requireSite(siteId);
  const { ent } = await getSiteContext(found.user.id);
  if (!ent.searchConsole) redirect(settingsRoutes.site(siteId, "search") as Route);
  return found;
}

/**
 * "Connect Search Console": asks Google for the read-only Search Console scope when it
 * isn't granted yet (one more consent screen), then picks the property that matches.
 */
export async function connectSearchConsoleAction(siteId: string, back: Back) {
  const { user, site } = await requireProSite(siteId);
  const account = await getGoogleAccount(user.id);
  if (!hasSearchConsoleScope(account?.scope)) {
    const done = `/api/search-console/connected?site=${site.id}&back=${back}`;
    await linkGoogleScope(SEARCH_CONSOLE_SCOPE, done, backTo(site.id, back, "denied"));
  }
  redirect(backTo(site.id, back, await autoConnect(site)));
}

/** Settings: use another of the user's Search Console properties for this site. */
export async function chooseSearchPropertyAction(siteId: string, formData: FormData) {
  const { site } = await requireProSite(siteId);
  const siteUrl = formData.get("property");
  const result =
    typeof siteUrl === "string" && siteUrl.length <= 300
      ? await chooseProperty(site, siteUrl)
      : "not_yours";
  redirect(backTo(site.id, "settings", result));
}

/** Settings: stop using Search Console for this site. */
export async function disconnectSearchConsoleAction(siteId: string) {
  const { site } = await requireProSite(siteId);
  await disconnectProperty(site);
  redirect(backTo(site.id, "settings", "disconnected"));
}

export type BrandState = { saved?: boolean; error?: string } | null;

/** Settings: other spellings of the site's name, for "Your name vs others". */
export async function saveBrandTermsAction(
  siteId: string,
  _state: BrandState,
  formData: FormData,
): Promise<BrandState> {
  const { site } = await requireProSite(siteId);
  const input = formData.get("terms");
  if (typeof input !== "string" || input.length > 1000) return { error: "That's too long." };
  await saveBrandTerms(site, readBrandTerms(input));
  refresh();
  return { saved: true };
}

export type SearchActionState = { error?: string; done?: boolean } | null;

/**
 * Marks this week's Google search action done: a chart note dated today that remembers
 * the page and the search, so later weeks can show how they moved. The page is checked
 * against this week's own pick; the browser can't choose another.
 */
export async function markSearchActionDoneAction(
  siteId: string,
  _state: SearchActionState,
  formData: FormData,
): Promise<SearchActionState> {
  const { site } = await requireProSite(siteId);
  const page = formData.get("page");
  const pick = await loadWeeklyPick(site).catch(() => null);
  const action = pick?.actions.find((a) => a.page === page);
  if (!action) return { error: "That page isn't this week's pick any more. Refresh the page." };
  await addSearchActionNote(site.id, {
    day: todayIn(site.timeZone),
    text: searchActionNote(action.path),
    page: action.page,
    query: action.query?.query ?? null,
  });
  refresh();
  return { done: true };
}
