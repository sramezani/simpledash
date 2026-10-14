"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { SignupPickState } from "@/components/cards/signup-picker-form";
import { requireSite, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { site } from "@/lib/db/schema";
import { classifyError } from "@/lib/ga4/errors";
import {
  addProperty,
  listKeyEventNames,
  listProperties,
  SiteLimitError,
  switchProperty,
} from "@/lib/ga4/properties";
import type { PropertyList } from "@/lib/ga4/property-choice";
import { getSitePublicPage } from "@/lib/public-page/public-page";
import { publicTag } from "@/lib/public-page/view";
import { readSiteId } from "@/lib/sites/access";
import { getSiteContext, markSiteOpened, removeSite } from "@/lib/sites/sites";
import { reportError } from "@/lib/report-error";
import { plans } from "@/config/plans";

const PROPERTY = /^properties\/\d{1,20}$/;

/** What adding or switching returns: the site to open, or why it didn't work. */
export type SitePick = { siteId?: string; error?: string };

/** The site picker's list, fetched live with the user's own token when it opens. */
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
 * Free's switcher: the new site takes the current one's place. The property must
 * be in the user's own Google list. Pro adds sites instead, so nothing is lost.
 */
export async function switchSite(propertyId: string): Promise<SitePick> {
  const user = await requireUser();
  if (typeof propertyId !== "string" || !PROPERTY.test(propertyId)) {
    return { error: "That isn't a Google Analytics property." };
  }
  const { ent } = await getSiteContext(user.id);
  if (ent.sites > 1) return { error: `On ${plans.pro.name}, add the site instead.` };
  try {
    return { siteId: (await switchProperty(user.id, propertyId)).id };
  } catch {
    return { error: "Couldn't switch to that site. Please try again." };
  }
}

/** Pro's "Add a site": up to the plan's limit, checked again on the server. */
export async function addSite(propertyId: string): Promise<SitePick> {
  const user = await requireUser();
  if (typeof propertyId !== "string" || !PROPERTY.test(propertyId)) {
    return { error: "That isn't a Google Analytics property." };
  }
  const { ent } = await getSiteContext(user.id);
  if (ent.sites <= 1) return { error: `Several sites are part of ${plans.pro.name}.` };
  try {
    return { siteId: (await addProperty(user.id, propertyId, ent.sites)).id };
  } catch (error) {
    if (error instanceof SiteLimitError) {
      return { error: `You have ${error.limit} sites, the most ${plans.pro.name} allows.` };
    }
    reportError("Adding a site failed", error, { userId: user.id });
    return { error: "Couldn't add that site. Please try again." };
  }
}

/**
 * "Switch to this site instead" (Free, on a site the plan doesn't open): makes one
 * of the user's own listed sites the one they see. Nothing leaves the list.
 */
export async function openListedSiteAction(formData: FormData) {
  const user = await requireUser();
  const id = readSiteId(formData.get("site"));
  const { sites } = await getSiteContext(user.id);
  const chosen = sites.find((s) => s.id === id);
  if (!chosen) redirect("/dashboard");
  await markSiteOpened(chosen);
  redirect(`/dashboard?site=${chosen.id}`);
}

/** Settings → Sites: take a site off a Pro user's list. Its data is kept. */
export async function removeSiteAction(formData: FormData) {
  const user = await requireUser();
  const id = readSiteId(formData.get("site"));
  if (!id) redirect("/settings#sites");
  const page = await getSitePublicPage(id);
  const result = await removeSite(user.id, id);
  if ("error" in result) redirect("/settings?sites=error#sites");
  if (page) updateTag(publicTag(page.slug)); // its public page pauses
  redirect("/settings?sites=removed#sites");
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
