/**
 * Public page addresses (docs/SPEC.md sections 9 and 15), made from the site's domain:
 * 3–40 characters of a–z, 0–9 and "-", not starting or ending with "-", and not a
 * reserved word. Pure, so it is tested.
 */

const RESERVED = new Set([
  "about",
  "account",
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "billing",
  "blog",
  "dashboard",
  "demo",
  "docs",
  "email",
  "help",
  "home",
  "login",
  "logout",
  "mail",
  "new",
  "p",
  "pricing",
  "privacy",
  "public",
  "settings",
  "signin",
  "signout",
  "signup",
  "simpledash",
  "static",
  "status",
  "support",
  "terms",
  "test",
  "ui-kit",
  "www",
]);

export function isValidSlug(slug: string): boolean {
  return (
    /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/.test(slug) &&
    !slug.includes("--") &&
    !RESERVED.has(slug)
  );
}

/** "www.My-Site.com" → "my-site-com". Falls back to "my-site" when nothing usable is left. */
export function slugFromDomain(domain: string): string {
  const base = domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return isValidSlug(base) ? base : "my-site";
}

/** Candidates to try when a slug is taken: "my-site", "my-site-2", "my-site-3"… */
export function slugCandidates(base: string, count = 20): string[] {
  const out = [base];
  for (let i = 2; out.length < count; i++)
    out.push(`${base.slice(0, 40 - String(i).length - 1)}-${i}`);
  return out;
}
