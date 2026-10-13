"use server";

import { refresh, updateTag } from "next/cache";
import { requireSite } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { savePublicPage, turnOnPublicPage } from "@/lib/public-page/public-page";
import { publicTag } from "@/lib/public-page/view";

export type ShareState = { url?: string; error?: string };
export type PublicPageFormState = {
  error?: string;
  saved?: boolean;
  /** What was sent, so a rejected form keeps the visitor's input. */
  values?: { slug: string; enabled: boolean; indexable: boolean; cards: string[] };
};

/**
 * Public pages, one per site. Each action is bound to a site ID on the page;
 * `requireSite` checks it is the user's own and open on their plan.
 */

/** The dashboard card's one-click "Turn on". Returns the link to show. */
export async function turnOnPublicPageAction(siteId: string): Promise<ShareState> {
  const { site } = await requireSite(siteId);
  try {
    const page = await turnOnPublicPage(site);
    updateTag(publicTag(page.slug));
    return { url: `${env.APP_URL}/p/${page.slug}` };
  } catch {
    return { error: "Couldn't turn on your public page. Please try again." };
  }
}

/** Settings → Public page: on or off, address, cards and indexing. */
export async function savePublicPageAction(
  siteId: string,
  _state: PublicPageFormState,
  formData: FormData,
): Promise<PublicPageFormState> {
  const { site } = await requireSite(siteId);
  const slug = formData.get("slug");
  const values = {
    slug: typeof slug === "string" ? slug.slice(0, 100) : "",
    enabled: formData.get("enabled") === "on",
    indexable: formData.get("indexable") === "on",
    cards: formData
      .getAll("cards")
      .filter((v): v is string => typeof v === "string")
      .slice(0, 20),
  };
  let result: Awaited<ReturnType<typeof savePublicPage>>;
  try {
    result = await savePublicPage(site, values);
  } catch {
    // Most likely someone took the same address a moment ago.
    return { error: "Couldn't save. Please try again, or try another address.", values };
  }
  if ("error" in result) return { error: result.error, values };
  updateTag(publicTag(result.page.slug));
  if (result.previousSlug && result.previousSlug !== result.page.slug) {
    updateTag(publicTag(result.previousSlug));
  }
  refresh();
  return { saved: true };
}
