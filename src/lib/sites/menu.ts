import type { PropertySummary } from "@/lib/ga4/property-choice";

/**
 * The rows of the site menu (docs/SPEC.md section 28.1). Pure, so it is tested.
 *
 * Every Google Analytics site the Google account can read is a row, grouped by the
 * Analytics account it belongs to. Rows that are already one of the user's sites carry
 * the site's ID (they open with a plain link and have settings); the others open
 * through the server, which adds the site to the user's list (no limit, on any plan).
 * The user's sites that Google no longer lists stay in the menu, with the reason.
 */

/** One of the user's sites, as the menu needs it. */
export type MenuSite = {
  id: string;
  propertyId: string;
  label: string;
  domain: string | null;
  /** "Google access ended", "No access…": shown under the name. */
  problem: string | null;
};

export type SiteMenuRow = {
  propertyId: string;
  label: string;
  domain: string | null;
  /** The Analytics account the property belongs to ("" when unknown). */
  account: string;
  /** Set when the property is one of the user's sites: a plain link to its dashboard. */
  siteId: string | null;
  /** The site shown now. */
  current: boolean;
  problem: string | null;
};

export type SiteMenuGroup = { account: string; rows: SiteMenuRow[] };

const toRow = (s: MenuSite, currentId: string, account = ""): SiteMenuRow => ({
  propertyId: s.propertyId,
  label: s.label,
  domain: s.domain,
  account,
  siteId: s.id,
  current: s.id === currentId,
  problem: s.problem,
});

/**
 * The menu's groups. Before Google's list arrives (`properties` null), only the user's
 * own sites show, the current one first, so the menu is useful at once.
 */
export function siteMenuGroups(
  properties: PropertySummary[] | null,
  sites: MenuSite[],
  currentId: string,
): SiteMenuGroup[] {
  if (properties === null) {
    const rows = sites.map((s) => toRow(s, currentId));
    rows.sort((a, b) => Number(b.current) - Number(a.current));
    return rows.length > 0 ? [{ account: "", rows }] : [];
  }
  const byProperty = new Map(sites.map((s) => [s.propertyId, s]));
  const groups = new Map<string, SiteMenuRow[]>();
  const seen = new Set<string>();
  for (const p of properties) {
    if (seen.has(p.propertyId)) continue;
    seen.add(p.propertyId);
    const own = byProperty.get(p.propertyId);
    const row: SiteMenuRow = own
      ? toRow(own, currentId, p.account)
      : {
          propertyId: p.propertyId,
          label: p.displayName,
          domain: null,
          account: p.account,
          siteId: null,
          current: false,
          problem: null,
        };
    const list = groups.get(p.account) ?? [];
    list.push(row);
    groups.set(p.account, list);
  }
  // The user's sites Google doesn't list any more (access lost) stay reachable.
  const missing = sites.filter((s) => !seen.has(s.propertyId)).map((s) => toRow(s, currentId));
  const result = [...groups].map(([account, rows]) => ({ account, rows }));
  return missing.length > 0 ? [...result, { account: "", rows: missing }] : result;
}

/** Rows whose name, account or property number contains the search, in any letter case. */
export function filterSiteMenu(groups: SiteMenuGroup[], query: string): SiteMenuGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      account: g.account,
      rows: g.rows.filter((r) =>
        [r.label, r.account, r.domain ?? "", r.propertyId.split("/")[1] ?? ""].some((v) =>
          v.toLowerCase().includes(q),
        ),
      ),
    }))
    .filter((g) => g.rows.length > 0);
}
