import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { site, type Site } from "@/lib/db/schema";
import { classifySearchError, listSearchConsoleSites, type SearchProblem } from "./client";
import { matchProperty, verifiedSites, type ScSite } from "./match";

/**
 * Linking a site to its Search Console property (docs/SPEC.md section 28.2). The
 * property must be one the user's own Google account can read: never trusted from
 * the browser.
 */

export type PropertyChoice =
  | { kind: "ok"; properties: ScSite[] }
  | { kind: "problem"; problem: SearchProblem };

/** The user's readable Search Console properties, or why they can't be listed. */
export async function listProperties(userId: string): Promise<PropertyChoice> {
  try {
    return { kind: "ok", properties: verifiedSites(await listSearchConsoleSites(userId)) };
  } catch (error) {
    return { kind: "problem", problem: classifySearchError(error) };
  }
}

/** Right after connecting: picks the property that matches the site's domain, if any. */
export async function autoConnect(
  owned: Site,
): Promise<"connected" | "no_match" | SearchProblem> {
  const list = await listProperties(owned.userId);
  if (list.kind === "problem") return list.problem;
  const match = matchProperty(owned.domain, list.properties);
  if (!match) return "no_match";
  await db.update(site).set({ searchConsoleUrl: match }).where(eq(site.id, owned.id));
  return "connected";
}

/** Settings: uses the property the user picked, after checking it's in their own list. */
export async function chooseProperty(
  owned: Site,
  siteUrl: string,
): Promise<"saved" | "not_yours" | SearchProblem> {
  const list = await listProperties(owned.userId);
  if (list.kind === "problem") return list.problem;
  if (!list.properties.some((p) => p.siteUrl === siteUrl)) return "not_yours";
  await db.update(site).set({ searchConsoleUrl: siteUrl }).where(eq(site.id, owned.id));
  return "saved";
}

/** Stops using Search Console for this site. Google access itself stays, for other sites. */
export async function disconnectProperty(owned: Site) {
  await db.update(site).set({ searchConsoleUrl: null }).where(eq(site.id, owned.id));
}

export async function saveBrandTerms(owned: Site, terms: string[]) {
  await db.update(site).set({ brandTerms: terms }).where(eq(site.id, owned.id));
}
