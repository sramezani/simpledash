"use server";

import { eq } from "drizzle-orm";
import type { Route } from "next";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { SignupPickState } from "@/components/cards/signup-picker-form";
import { requireSite, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { site } from "@/lib/db/schema";
import { classifyError } from "@/lib/ga4/errors";
import { addProperty, listKeyEventNames, listProperties } from "@/lib/ga4/properties";
import type { PropertyList } from "@/lib/ga4/property-choice";
import { getSitePublicPage } from "@/lib/public-page/public-page";
import { publicTag } from "@/lib/public-page/view";
import { readSiteId } from "@/lib/sites/access";
import { settingsRoutes } from "@/lib/settings-routes";
import { getSiteContext, removeSite } from "@/lib/sites/sites";
import { reportError } from "@/lib/report-error";

const PROPERTY = /^properties\/\d{1,20}$/;

/** What opening a site returns: the site to show, or why it didn't work. */
export type SitePick = { siteId?: string; error?: string };

/** The site menu's list of Google Analytics sites, fetched live with the user's own token. */
export async function listMyProperties(): Promise<PropertyList> {
  const user = await requireUser();
  try {
    return { properties: await listProperties(user.id) };
  } catch (error) {
    return classifyError(error).problem === "revoked"
      ? { error: "Google access ended. Reconnect to see your sites.", reconnect: true }
      : { error: "Couldn't load your sites from Google. Please try again." };
  }
}

/**
 * The site menu's click on a Google Analytics site that isn't one of the user's sites
 * yet (docs/SPEC.md section 28.1): it joins their list, on Free and Pro alike, with no
 * limit. The property must be in the user's own Google list.
 */
export async function openSite(propertyId: string): Promise<SitePick> {
  const user = await requireUser();
  if (typeof propertyId !== "string" || !PROPERTY.test(propertyId)) {
    return { error: "That isn't a Google Analytics property." };
  }
  try {
    const opened = await addProperty(user.id, propertyId);
    return { siteId: opened.id };
  } catch (error) {
    reportError("Opening a site failed", error, { userId: user.id });
    return { error: "Couldn't open that site. Please try again." };
  }
}

/**
 * Settings → a site → "Remove": takes the site off the user's list. Its notes and
 * settings are kept for when it's opened again, and its public page pauses.
 */
export async function removeSiteAction(formData: FormData) {
  const user = await requireUser();
  const id = readSiteId(formData.get("site"));
  if (!id) redirect("/settings");
  const page = await getSitePublicPage(id);
  const result = await removeSite(user.id, id);
  if ("error" in result) redirect(`${settingsRoutes.site(id)}?removed=error` as Route);
  if (page) updateTag(publicTag(page.slug)); // its public page pauses
  const { site: next } = await getSiteContext(user.id);
  redirect((next ? `${settingsRoutes.site(next.id)}?removed=1` : "/settings") as Route);
}

/** "Which action means a signup?": saves a key event of one of the user's own sites. */
export async function chooseSignupEvent(
  siteId: string,
  _state: SignupPickState,
  formData: FormData,
): Promise<SignupPickState> {
  const { user, site: chosen } = await requireSite(siteId);
  const event = formData.get("event");
  if (typeof event !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(event)) {
    return { error: "Pick one of the events in the list." };
  }
  let keyEvents: string[];
  try {
    keyEvents = await listKeyEventNames(user.id, chosen.propertyId, true);
  } catch {
    return { error: "Couldn't check your key events with Google. Please try again." };
  }
  if (!keyEvents.includes(event)) {
    return { error: `"${event}" isn't a key event in Google Analytics any more.` };
  }
  await db.update(site).set({ signupEvent: event }).where(eq(site.id, chosen.id));
  refresh();
  return { saved: true };
}
