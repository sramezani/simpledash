/**
 * How a site is named on screen (docs/SPEC.md section 28.1). Pure, so it is tested.
 *
 * Two Google Analytics properties can share a web address (a blog with its own property,
 * a reverse proxy), so a site is named by its Google Analytics name, with its address and
 * property number on a smaller line under it.
 */

type Named = { displayName: string; domain: string | null; propertyId: string };

/** The property's name in Google Analytics, or its address when the name is empty. */
export function siteName(site: Named): string {
  return site.displayName.trim() || site.domain || propertyNumber(site.propertyId);
}

/** "properties/123456" → "123456". */
export function propertyNumber(propertyId: string): string {
  return propertyId.split("/")[1] ?? propertyId;
}

/** The smaller line: "mysite.com · ID 123456", or only the ID without an address. */
export function siteDetail(site: Pick<Named, "domain" | "propertyId">): string {
  const id = `ID ${propertyNumber(site.propertyId)}`;
  return site.domain ? `${site.domain} · ${id}` : id;
}
