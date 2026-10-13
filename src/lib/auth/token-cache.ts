/**
 * Google access tokens live about an hour. Reusing one per user (and sharing an
 * in-flight lookup) means a dashboard's parallel batches don't each fetch or refresh
 * it. Kept in its own module so the Better Auth hooks can drop a user's token when
 * Google's tokens change (a new scope), without importing google.ts.
 */
const tokens = new Map<string, { token: Promise<string>; until: number }>();
const REUSE_MS = 10 * 60 * 1000;

export function cachedToken(userId: string): Promise<string> | null {
  const cached = tokens.get(userId);
  return cached && cached.until > Date.now() ? cached.token : null;
}

export function rememberToken(userId: string, token: Promise<string>) {
  tokens.set(userId, { token, until: Date.now() + REUSE_MS });
  token.catch(() => tokens.delete(userId));
}

/** Forget a user's cached token: Google said it's no longer valid, or new tokens arrived. */
export function forgetGoogleToken(userId: string) {
  tokens.delete(userId);
}
