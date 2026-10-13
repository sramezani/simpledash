/** Pure helpers for the automatic property choice (docs/SPEC.md section 7). Tested. */

export type PropertySummary = { propertyId: string; displayName: string; account: string };

/** What the site picker's server action returns. `reconnect`: Google access ended. */
export type PropertyList = { properties: PropertySummary[] } | { error: string; reconnect?: boolean };

/** Index of the property with the most visitors. Failed checks (null) count as none; ties go to the first. */
export function pickBusiest(counts: (number | null)[]): number {
  let best = 0;
  let bestCount = -1;
  counts.forEach((count, i) => {
    const c = count ?? -1;
    if (c > bestCount) {
      best = i;
      bestCount = c;
    }
  });
  return best;
}

/** "https://www.mysite.com/app" → "mysite.com". Null when there is no usable URL. */
export function hostnameFromUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  try {
    const host = new URL(uri.includes("://") ? uri : `https://${uri}`).hostname.toLowerCase();
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** GA4 timestamps arrive as {seconds, nanos} or ISO strings over REST. */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const seconds = Number((value as { seconds?: unknown }).seconds);
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
}

/** Enums arrive as names or numbers depending on the transport. */
export function enumIs(value: unknown, name: string, number: number): boolean {
  return value === name || value === number;
}

/** Runs tasks with at most `limit` at once, keeping the order of results. */
export async function mapLimit<T, U>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<U>,
): Promise<U[]> {
  const results: U[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await task(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
