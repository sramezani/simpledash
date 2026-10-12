"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { requireSite, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { site } from "@/lib/db/schema";
import { classifyError } from "@/lib/ga4/errors";
import { listKeyEventNames, listProperties, switchProperty } from "@/lib/ga4/properties";
import type { PropertyList } from "@/lib/ga4/property-choice";
import type { SignupPickState } from "@/components/cards/signup-picker-form";

/** The switcher's list, fetched live with the user's own token when it opens. */
export async function listMyProperties(): Promise<PropertyList> {
  const user = await requireUser();
  try {
    return { properties: await listProperties(user.id) };
  } catch (error) {
    return {
      error:
        classifyError(error).problem === "revoked"
          ? "Google access ended. Reconnect to see your sites."
          : "Couldn't load your sites from Google. Please try again.",
    };
  }
}

/** Switches the active site. The property must be in the user's own Google list. */
export async function switchSite(propertyId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (typeof propertyId !== "string" || !/^properties\/\d{1,20}$/.test(propertyId)) {
    return { error: "That isn't a Google Analytics property." };
  }
  try {
    await switchProperty(user.id, propertyId);
  } catch {
    return { error: "Couldn't switch to that site. Please try again." };
  }
  refresh();
  return {};
}

/** "Which action means a signup?": saves a key event of the user's own active site. */
export async function chooseSignupEvent(
  _state: SignupPickState,
  formData: FormData,
): Promise<SignupPickState> {
  const { user, site: active } = await requireSite();
  const event = formData.get("event");
  if (typeof event !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(event)) {
    return { error: "Pick one of the events in the list." };
  }
  let keyEvents: string[];
  try {
    keyEvents = await listKeyEventNames(user.id, active.propertyId, true);
  } catch {
    return { error: "Couldn't check your key events with Google. Please try again." };
  }
  if (!keyEvents.includes(event)) {
    return { error: `"${event}" isn't a key event in Google Analytics any more.` };
  }
  await db.update(site).set({ signupEvent: event }).where(eq(site.id, active.id));
  refresh();
  return { saved: true };
}
