/**
 * Which Search Console property belongs to a site (docs/SPEC.md section 28.2). Pure,
 * so it is tested.
 */

export type ScSite = { siteUrl: string; permissionLevel: string };

/** The properties the user can read: unverified ones return no data. */
export function verifiedSites(entries: ScSite[]): ScSite[] {
  return entries.filter((e) => e.permissionLevel !== "siteUnverifiedUser");
}

const DOMAIN_PREFIX = "sc-domain:";

/** "sc-domain:example.com" → a domain property for example.com; "https://example.com/" → a URL property. */
export function describeProperty(
  siteUrl: string,
): { kind: "domain"; host: string } | { kind: "prefix"; host: string; url: string } | null {
  if (siteUrl.startsWith(DOMAIN_PREFIX)) {
    const host = siteUrl.slice(DOMAIN_PREFIX.length).toLowerCase();
    return host ? { kind: "domain", host } : null;
  }
  try {
    const url = new URL(siteUrl);
    return { kind: "prefix", host: url.hostname.toLowerCase(), url: siteUrl };
  } catch {
    return null;
  }
}

/** The property in plain words: "Domain example.com", "https://example.com/". */
export function propertyLabel(siteUrl: string): string {
  const p = describeProperty(siteUrl);
  if (!p) return siteUrl;
  return p.kind === "domain" ? `Domain ${p.host}` : p.url;
}

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");

/**
 * The best property for a site's domain: its own domain property, then a URL property
 * for it (https before http, without www before with), then a domain property of a
 * parent domain (sc-domain:example.com for blog.example.com). Null when none fits.
 */
export function matchProperty(domain: string | null, entries: ScSite[]): string | null {
  if (!domain) return null;
  const host = bare(domain);
  const urls = verifiedSites(entries).map((e) => e.siteUrl);
  const exact = [
    `${DOMAIN_PREFIX}${host}`,
    `https://${host}/`,
    `https://www.${host}/`,
    `http://${host}/`,
    `http://www.${host}/`,
  ];
  for (const candidate of exact) {
    const found = urls.find((u) => u.toLowerCase() === candidate);
    if (found) return found;
  }
  // A parent domain property: the longest parent first (shop.eu.example.com → eu.example.com).
  const parents = urls
    .map((u) => ({ u, p: describeProperty(u) }))
    .filter(({ p }) => p?.kind === "domain" && host.endsWith(`.${p.host}`))
    .sort((a, b) => b.p!.host.length - a.p!.host.length);
  return parents[0]?.u ?? null;
}

const escapeRegex = (text: string) => text.replace(/[\\.+*?()|[\]{}^$]/g, "\\$&");

/**
 * A page filter (RE2) when a parent domain property is used for a subdomain site, so
 * the numbers are only the site's own pages. Null when the property is the site's own.
 */
export function hostFilter(siteUrl: string, domain: string | null): string | null {
  const p = describeProperty(siteUrl);
  if (!p || p.kind !== "domain" || !domain) return null;
  const host = bare(domain);
  if (host === p.host || !host.endsWith(`.${p.host}`)) return null;
  return `^https?://(www\\.)?${escapeRegex(host)}(/|$)`;
}
