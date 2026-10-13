/**
 * The site's name in searches, for "Your name vs others" (docs/SPEC.md section 28.2).
 * Pure, so it is tested.
 */

/** Second-level labels that come before a country code (example.co.uk). */
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "ac", "gov", "edu", "or", "ne", "go"]);

export const MAX_BRAND_TERMS = 10;

/** The name in a domain: "meetline.me" → "meetline", "blog.example.co.uk" → "example". */
export function baseName(domain: string | null): string | null {
  if (!domain) return null;
  const parts = domain.toLowerCase().replace(/^www\./, "").split(".").filter(Boolean);
  if (parts.length < 2) return parts[0] ?? null;
  parts.pop(); // the top-level domain
  if (parts.length > 1 && SECOND_LEVEL.has(parts.at(-1)!)) parts.pop();
  return parts.at(-1) ?? null;
}

/**
 * Every spelling counted as the site's name: from the domain ("simple-dash" also as
 * "simple dash" and "simpledash") plus the user's own, lowercase and without repeats.
 */
export function brandTerms(domain: string | null, extra: readonly string[] = []): string[] {
  const out: string[] = [];
  const add = (term: string) => {
    const t = term.trim().toLowerCase().replace(/\s+/g, " ");
    if (t.length >= 2 && !out.includes(t)) out.push(t);
  };
  const base = baseName(domain);
  if (base) {
    add(base);
    if (base.includes("-")) {
      add(base.replaceAll("-", " "));
      add(base.replaceAll("-", ""));
    }
  }
  extra.forEach(add);
  return out.slice(0, MAX_BRAND_TERMS + 3);
}

const escapeRegex = (text: string) => text.replace(/[\\.+*?()|[\]{}^$]/g, "\\$&");

/**
 * The RE2 pattern Search Console matches queries against. Names of 5 letters or more
 * match anywhere ("meetline" in "meetline pricing"); shorter ones only as a whole word,
 * so "go" doesn't count every "google" search. Queries are lowercase in Search Console.
 */
export function brandPattern(terms: readonly string[]): string | null {
  if (terms.length === 0) return null;
  const parts = terms.map((t) => (t.length >= 5 ? escapeRegex(t) : `\\b${escapeRegex(t)}\\b`));
  return `(?i)(${parts.join("|")})`;
}

/** Settings → "Other spellings": comma- or line-separated, 2–40 characters each, at most 10. */
export function readBrandTerms(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(/[,\n]/)) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (t.length < 2 || t.length > 40 || out.includes(t)) continue;
    out.push(t);
    if (out.length === MAX_BRAND_TERMS) break;
  }
  return out;
}
