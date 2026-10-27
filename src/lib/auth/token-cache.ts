/**
 * Google access tokens live about an hour. Reusing one per user (and sharing an
 * in-flight lookup) means a dashboard's parallel batches don't each fetch or refresh
 * it. Kept in its own module so the Better Auth hooks can drop a user's token when
 * Google's tokens change (a new scope), without importing google.ts.
 */

/** An access token and when Google says it runs out (ms), or null when that isn't known. */
export type GoogleToken = { token: string; expiresAt: number | null };

type Entry = { token: Promise<string>; until: number };

const tokens = new Map<string, Entry>();
const REUSE_MS = 10 * 60 * 1000;
/** A token is set aside this long before it runs out, so no call starts with one about to end. */
export const EXPIRY_MARGIN_MS = 60 * 1000;

export function cachedToken(userId: string, now: number = Date.now()): Promise<string> | null {
  const cached = tokens.get(userId);
  return cached && cached.until > now ? cached.token : null;
}

/**
 * Keeps a token for up to 10 minutes, and never past a minute before it runs out.
 * A failed lookup is dropped. Returns the token, for the caller to use.
 */
export function rememberToken(
  userId: string,
  lookup: Promise<GoogleToken>,
  now: number = Date.now(),
): Promise<string> {
  const entry: Entry = { token: lookup.then((t) => t.token), until: now + REUSE_MS };
  tokens.set(userId, entry);
  lookup.then(
    ({ expiresAt }) => {
      if (expiresAt !== null) entry.until = Math.min(entry.until, expiresAt - EXPIRY_MARGIN_MS);
    },
    () => {
      // Only this lookup's entry: a newer one may already have replaced it.
      if (tokens.get(userId) === entry) tokens.delete(userId);
    },
  );
  return entry.token;
}

/**
 * A token other than `stale`, which Google just turned down: the one another call already
 * got in the meantime, or a new one from `fetchNew`. Parallel calls that all hit the same
 * 401 share one new token.
 */
export async function replaceToken(
  userId: string,
  stale: string,
  fetchNew: () => Promise<GoogleToken>,
): Promise<string> {
  const cached = cachedToken(userId);
  if (cached) {
    const token = await cached.catch(() => null);
    if (token !== null && token !== stale) return token;
    // While we waited, another call may have started fetching a new one.
    const newer = cachedToken(userId);
    if (newer && newer !== cached) return newer;
  }
  return rememberToken(userId, fetchNew());
}

/** Forget a user's cached token: Google said it's no longer valid, or new tokens arrived. */
export function forgetGoogleToken(userId: string) {
  tokens.delete(userId);
}
