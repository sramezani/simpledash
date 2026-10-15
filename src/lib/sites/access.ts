/**
 * The user's sites (docs/SPEC.md section 28.1). Pure, so it is tested.
 *
 * - A site with `addedAt` set is in the user's list; `isActive` is the one the
 *   dashboard opens with (the one opened most recently).
 * - Every site in the list opens, on Free and Pro alike: there is no site limit
 *   (Siamak, Oct 15, 2026).
 */

export type SiteRef = { id: string; isActive: boolean; addedAt: Date | null };

/** The user's list: added sites in the order they were added, plus the active one if it isn't added. */
export function siteList<T extends SiteRef>(sites: T[]): T[] {
  const added = sites
    .filter((s) => s.addedAt !== null)
    .sort((a, b) => a.addedAt!.getTime() - b.addedAt!.getTime() || a.id.localeCompare(b.id));
  const active = sites.find((s) => s.isActive);
  return active && !added.includes(active) ? [active, ...added] : added;
}

/**
 * The site a page should show: the one named in the address, or the active one.
 * An ID that isn't one of the user's listed sites gives null, never someone else's site.
 */
export function chooseSite<T extends SiteRef>(
  sites: T[],
  requested: string | null | undefined,
): T | null {
  const list = siteList(sites);
  const site = requested
    ? list.find((s) => s.id === requested)
    : (list.find((s) => s.isActive) ?? list[0]);
  return site ?? null;
}

/** What a site's status means for its numbers, in plain words (or null when fine). */
export function siteProblem(status: "ok" | "needs_reconnect" | "no_access"): string | null {
  if (status === "needs_reconnect") return "Google access ended";
  if (status === "no_access") return "No access to this site in Google Analytics";
  return null;
}

/** A site ID as it can appear in an address or form: our IDs are UUIDs. */
export function readSiteId(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
}
