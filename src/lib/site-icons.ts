import "server-only";

/**
 * Site icons for Sources (docs/SPEC.md section 19). Icons come only from one fixed
 * service, never from arbitrary URLs, so there is no SSRF. Responses are size-capped,
 * SVG is refused (it can carry scripts), and anything unexpected gets the generic icon.
 */

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const MAX_BYTES = 64 * 1024;
const ALLOWED_TYPES = new Set([
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export function isIconDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain);
}

/** The generic icon: a small grey globe, as an SVG we wrote ourselves. */
export const GENERIC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/><path d="M1.5 8h13M8 1.5c2 2.2 2 10.8 0 13M8 1.5c-2 2.2-2 10.8 0 13" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/></svg>`;

type Icon = { body: ArrayBuffer; type: string };

// A small in-process cache, so a popular icon is fetched once, not once per visitor.
// Cloudflare caches the responses too (docs/deploy.md). Oldest entries go first.
const MAX_CACHED = 500;
const cache = new Map<string, { icon: Icon | null; until: number }>();

/** The icon for a domain, from memory when we fetched it recently. */
export async function getSiteIcon(domain: string, now: number = Date.now()): Promise<Icon | null> {
  const hit = cache.get(domain);
  if (hit && hit.until > now) return hit.icon;
  const icon = await fetchSiteIcon(domain);
  cache.delete(domain);
  cache.set(domain, { icon, until: now + (icon ? 7 : 1) * 24 * 60 * 60 * 1000 });
  if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!);
  return icon;
}

export async function fetchSiteIcon(domain: string): Promise<Icon | null> {
  if (!isIconDomain(domain)) return null;
  try {
    const response = await fetch(`https://icons.duckduckgo.com/ip3/${domain}.ico`, {
      signal: AbortSignal.timeout(4000),
      redirect: "error",
    });
    if (!response.ok) return null;
    const type = (response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (!ALLOWED_TYPES.has(type)) return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) return null;
    const body = await readCapped(response, MAX_BYTES);
    if (!body || body.byteLength === 0) return null;
    return { body, type };
  } catch {
    return null;
  }
}

/** Reads a response body, giving up as soon as it passes `limit` bytes. */
async function readCapped(response: Response, limit: number): Promise<ArrayBuffer | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}
