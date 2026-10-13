import "server-only";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { ANALYTICS_SCOPE, SEARCH_CONSOLE_SCOPE } from "./scopes";

/** The only scopes SimpleDash ever asks for after sign-in. Both read-only. */
const ALLOWED = [ANALYTICS_SCOPE, SEARCH_CONSOLE_SCOPE] as const;

/**
 * Sends the signed-in user to Google to grant one more read-only scope. Better Auth's
 * link flow (unlike a plain sign-in) merges the new scope into the stored one, with the
 * new tokens. Server code only: it is never a server action, so the scope can't be
 * chosen by the browser.
 */
export async function linkGoogleScope(
  scope: (typeof ALLOWED)[number],
  callbackURL: string,
  errorCallbackURL: string,
): Promise<never> {
  if (!(ALLOWED as readonly string[]).includes(scope)) throw new Error("Scope not allowed");
  const { url } = await auth.api.linkSocialAccount({
    body: { provider: "google", scopes: [scope], callbackURL, errorCallbackURL },
    headers: await headers(),
  });
  redirect((url || errorCallbackURL) as Route);
}
