import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Site } from "@/lib/db/schema";
import { readSiteId } from "@/lib/sites/access";
import { getSiteContext } from "@/lib/sites/sites";
import { auth } from "./auth";
import { SIGNED_IN_HINT } from "./signed-in-hint";

/** The signed-in session, read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

/** Runs at the top of every signed-in page and server action. Sends signed-out visitors to /signin. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/signin");
  return session.user;
}

/**
 * The signed-in user and one of their own sites that the plan lets them open: the one
 * named by `siteId` (a form field or `?site=`), or the active one. Never trusts a
 * property ID from the browser, and a site ID only after checking it is theirs.
 * For pages and actions that need a site; anything else is a 404.
 */
export async function requireSite(siteId?: unknown): Promise<{ user: SessionUser; site: Site }> {
  const user = await requireUser();
  const found = await findOpenSite(user.id, siteId);
  if (!found) notFound();
  return { user, site: found };
}

/** One of the user's sites they may open now, or null (route handlers answer 404). */
export async function findOpenSite(userId: string, siteId?: unknown): Promise<Site | null> {
  const given = siteId !== undefined && siteId !== null && siteId !== "";
  const requested = given ? readSiteId(siteId) : null;
  // A malformed ID is never "the active site": it's simply not found.
  if (given && !requested) return null;
  const { choice } = await getSiteContext(userId, requested);
  return choice.kind === "open" ? choice.site : null;
}

/** For route handlers: the user, or null (the handler answers 401). */
export async function getApiUser(): Promise<SessionUser | null> {
  return (await getSession())?.user ?? null;
}

/**
 * Signs the current browser out, also when the session row is already gone (account
 * deleted). Clearing the cookies matters: the session cookie cache lasts 5 minutes.
 */
export async function endCurrentSession() {
  const jar = await cookies();
  jar.delete(SIGNED_IN_HINT);
  try {
    // Better Auth deletes the session and expires its cookies (with the right attributes).
    await auth.api.signOut({ headers: await headers() });
    return;
  } catch {
    // No session row any more: expire the cookies by hand.
  }
  for (const { name } of jar.getAll()) {
    if (!/^(__Secure-)?better-auth\./.test(name)) continue;
    // Browsers ignore a __Secure- cookie unless the Set-Cookie also says Secure.
    jar.delete({ name, path: "/", secure: name.startsWith("__Secure-") });
  }
}
