"use server";

import type { Route } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { linkGoogleScope } from "@/lib/auth/link-scope";
import { ANALYTICS_SCOPE } from "@/lib/auth/scopes";
import { requireUser } from "@/lib/auth/session";
import { SIGNED_IN_HINT } from "@/lib/auth/signed-in-hint";

/**
 * Starts Google sign-in: one consent screen for sign-in and read-only Analytics.
 * Also used by "Reconnect Google". Works without JavaScript (a form post).
 */
export async function signInWithGoogle() {
  const { url } = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/signin" },
    headers: await headers(),
  });
  if (!url) redirect("/signin?error=start");
  redirect(url as Route);
}

/**
 * "Allow access": the Analytics box was unticked on Google's consent screen. The link
 * flow updates the stored scope (a plain sign-in wouldn't), so this state can't loop.
 */
export async function allowAnalyticsAccess() {
  await requireUser();
  await linkGoogleScope(ANALYTICS_SCOPE, "/dashboard", "/dashboard");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  (await cookies()).delete(SIGNED_IN_HINT);
  redirect("/");
}
