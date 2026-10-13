import type { Entitlements } from "@/lib/billing/plan";

/**
 * Which sites an account can open (docs/SPEC.md section 28.1). Pure, so it is tested.
 *
 * - A site with `addedAt` set is in the user's list; `isActive` is the one the
 *   dashboard opens with (the one opened most recently).
 * - Growth opens every added site, up to its limit, in the order they were added.
 * - Starter and trials open only the active site. Sites added while on Growth stay in
 *   the list, paused, and open again after upgrading (Siamak, Oct 13, 2026).
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

/** The sites the plan lets the user open right now. */
export function openableSites<T extends SiteRef>(
  sites: T[],
  ent: Pick<Entitlements, "sites">,
): T[] {
  const list = siteList(sites);
  if (ent.sites <= 1) {
    const active = list.find((s) => s.isActive) ?? list[0];
    return active ? [active] : [];
  }
  return list.slice(0, ent.sites);
}

export type SiteChoice<T> =
  /** Show this site. */
  | { kind: "open"; site: T }
  /** In the list, but the plan doesn't open it: show the upgrade panel. */
  | { kind: "upgrade"; site: T }
  /** Not the user's site, or not in the list. */
  | { kind: "missing" };

/**
 * The site a page should show: the one named in the address, or the active one.
 * An ID that isn't one of the user's listed sites is "missing", never someone else's.
 */
export function chooseSite<T extends SiteRef>(
  sites: T[],
  ent: Pick<Entitlements, "sites">,
  requested: string | null | undefined,
): SiteChoice<T> {
  const list = siteList(sites);
  const openable = openableSites(sites, ent);
  const site = requested
    ? list.find((s) => s.id === requested)
    : (openable.find((s) => s.isActive) ?? openable[0]);
  if (!site) return { kind: "missing" };
  return openable.includes(site) ? { kind: "open", site } : { kind: "upgrade", site };
}

/** Whether one more site can be added: Growth below its limit. */
export function canAddSite(sites: SiteRef[], ent: Pick<Entitlements, "sites">): boolean {
  return ent.sites > 1 && sites.filter((s) => s.addedAt !== null).length < ent.sites;
}

/** A site ID as it can appear in an address or form: our IDs are UUIDs. */
export function readSiteId(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
}
