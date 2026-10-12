import "server-only";
import { symmetricDecrypt } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { auth } from "./auth";
import { GoogleAccessError, isRevokedGrant } from "./google-errors";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export function getGoogleAccount(userId: string) {
  return db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });
}

/** Decrypts a stored token with Better Auth's key. Null when it can't (e.g. the secret changed). */
async function decrypt(value: string): Promise<string | null> {
  const ctx = await auth.$context;
  try {
    return await symmetricDecrypt({ key: ctx.secretConfig, data: value });
  } catch {
    return null;
  }
}

// Access tokens live about an hour. Reusing one per user (and sharing an in-flight
// lookup) means a dashboard's parallel batches don't each fetch or refresh it.
const tokens = new Map<string, { token: Promise<string>; until: number }>();
const REUSE_MS = 10 * 60 * 1000;

/** Forget a user's cached token, e.g. after Google says it's no longer valid. */
export function forgetGoogleToken(userId: string) {
  tokens.delete(userId);
}

/**
 * A valid Google access token for a user (docs/SPEC.md section 6). Better Auth
 * refreshes it when needed. Jobs call this with the site owner's user ID.
 * Throws GoogleAccessError: "revoked" when Google says the grant is gone.
 */
export function getGoogleAccessToken(userId: string): Promise<string> {
  const cached = tokens.get(userId);
  if (cached && cached.until > Date.now()) return cached.token;
  const token = fetchAccessToken(userId);
  tokens.set(userId, { token, until: Date.now() + REUSE_MS });
  token.catch(() => tokens.delete(userId));
  return token;
}

async function fetchAccessToken(userId: string): Promise<string> {
  const row = await getGoogleAccount(userId);
  if (!row) throw new GoogleAccessError("no_account");
  try {
    const { accessToken } = await auth.api.getAccessToken({ body: { userId, accountId: row.id } });
    if (accessToken) return accessToken;
  } catch {
    // Better Auth doesn't say why a refresh failed, so ask Google directly below.
  }
  return refreshDirectly(row.refreshToken);
}

async function refreshDirectly(encryptedRefreshToken: string | null): Promise<string> {
  if (!encryptedRefreshToken) throw new GoogleAccessError("revoked", "No refresh token stored");
  const refreshToken = await decrypt(encryptedRefreshToken);
  if (!refreshToken) throw new GoogleAccessError("revoked", "Stored token can't be decrypted");
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new GoogleAccessError("unavailable", "Google's token server didn't answer");
  }
  const body: unknown = await response.json().catch(() => null);
  const accessToken = (body as { access_token?: unknown } | null)?.access_token;
  if (response.ok && typeof accessToken === "string") return accessToken;
  if (isRevokedGrant(body)) throw new GoogleAccessError("revoked", "Google access was revoked");
  throw new GoogleAccessError("unavailable", `Google's token server answered ${response.status}`);
}

/** An auth client for the GA4 libraries, holding a fresh access token. */
export async function getGoogleAuthClient(userId: string): Promise<OAuth2Client> {
  const client = new OAuth2Client();
  client.setCredentials({ access_token: await getGoogleAccessToken(userId) });
  return client;
}

/** Revokes the user's Google grant (disconnect and account deletion). Best effort. */
export async function revokeGoogleAccess(userId: string): Promise<void> {
  const row = await getGoogleAccount(userId);
  const stored = row?.refreshToken ?? row?.accessToken;
  if (!stored) return;
  forgetGoogleToken(userId);
  const token = await decrypt(stored);
  if (!token) return;
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => undefined);
}
