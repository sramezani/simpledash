"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

/**
 * Starts Google sign-in: one consent screen for sign-in and read-only Analytics.
 * Also used by "Allow access" and "Reconnect Google". Works without JavaScript (a form post).
 */
export async function signInWithGoogle() {
  const { url } = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/signin" },
    headers: await headers(),
  });
  if (!url) redirect("/signin?error=start");
  redirect(url as Route);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
