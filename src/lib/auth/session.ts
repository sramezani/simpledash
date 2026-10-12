import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { site, type Site } from "@/lib/db/schema";
import { auth } from "./auth";

/** The signed-in session, read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

/** Runs at the top of every signed-in page and server action. Sends signed-out visitors to /signin. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/signin");
  return session.user;
}

/** The user's one active site, or null when no GA4 property is connected. */
export const getActiveSite = cache(async (userId: string): Promise<Site | null> => {
  const row = await db.query.site.findFirst({
    where: and(eq(site.userId, userId), eq(site.isActive, true)),
  });
  return row ?? null;
});

/**
 * The signed-in user and their own active site. Never trusts a property ID from the browser.
 * For pages and actions that need a site; anything else is a 404.
 */
export async function requireSite(): Promise<{ user: SessionUser; site: Site }> {
  const user = await requireUser();
  const active = await getActiveSite(user.id);
  if (!active) notFound();
  return { user, site: active };
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
  try {
    // Better Auth deletes the session and expires its cookies (with the right attributes).
    await auth.api.signOut({ headers: await headers() });
    return;
  } catch {
    // No session row any more: expire the cookies by hand.
  }
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (!/^(__Secure-)?better-auth\./.test(name)) continue;
    // Browsers ignore a __Secure- cookie unless the Set-Cookie also says Secure.
    jar.delete({ name, path: "/", secure: name.startsWith("__Secure-") });
  }
}
