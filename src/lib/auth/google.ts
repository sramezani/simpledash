import "server-only";
import { and, eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { auth } from "./auth";
import { GoogleAccessError, isRevokedGrant, withTokenRetry } from "./google-errors";
import { decryptSecret } from "./secrets";
import {
  cachedToken,
  EXPIRY_MARGIN_MS,
  forgetGoogleToken,
  rememberToken,
  replaceToken,
  type GoogleToken,
} from "./token-cache";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export function getGoogleAccount(userId: string) {
  return db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });
}

/** Decrypts a stored token with Better Auth's key. Null when it can't (e.g. the secret changed). */
const decrypt = decryptSecret;

export { forgetGoogleToken };

/**
 * A valid Google access token for a user (docs/SPEC.md section 6). Better Auth
 * refreshes it when needed. Jobs call this with the site owner's user ID.
 * Throws GoogleAccessError: "revoked" when Google says the grant is gone.
 */
export function getGoogleAccessToken(userId: string): Promise<string> {
  return cachedToken(userId) ?? rememberToken(userId, fetchAccessToken(userId));
}

/**
 * Runs a Google call with the user's token. If Google turns the token down (a 401: it ran
 * out early), the call runs once more with a new one. Every Google API call goes through this.
 */
export function withGoogleToken<T>(userId: string, call: (token: string) => Promise<T>) {
  return withTokenRetry(
    () => getGoogleAccessToken(userId),
    (stale) => replaceToken(userId, stale, () => fetchAccessToken(userId, true)),
    call,
  );
}

/** `fresh`: skip Better Auth's stored token and ask Google for a new one (after a 401). */
async function fetchAccessToken(userId: string, fresh = false): Promise<GoogleToken> {
  const row = await getGoogleAccount(userId);
  if (!row) throw new GoogleAccessError("no_account");
  if (!fresh) {
    try {
      const { accessToken, accessTokenExpiresAt } = await auth.api.getAccessToken({
        body: { userId, accountId: row.id },
      });
      const expiresAt = accessTokenExpiresAt ? new Date(accessTokenExpiresAt).getTime() : null;
      // Better Auth hands back its stored token until 5 seconds before it runs out. One with
      // less than a minute left is swapped for a new one below instead.
      if (accessToken && (expiresAt === null || expiresAt - Date.now() > EXPIRY_MARGIN_MS)) {
        return { token: accessToken, expiresAt };
      }
    } catch {
      // Better Auth doesn't say why a refresh failed, so ask Google directly below.
    }
  }
  return refreshDirectly(row.refreshToken);
}

async function refreshDirectly(encryptedRefreshToken: string | null): Promise<GoogleToken> {
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
  const body = (await response.json().catch(() => null)) as {
    access_token?: unknown;
    expires_in?: unknown;
  } | null;
  const accessToken = body?.access_token;
  if (response.ok && typeof accessToken === "string") {
    const seconds = body?.expires_in;
    return {
      token: accessToken,
      expiresAt: typeof seconds === "number" ? Date.now() + seconds * 1000 : null,
    };
  }
  if (isRevokedGrant(body)) throw new GoogleAccessError("revoked", "Google access was revoked");
  throw new GoogleAccessError("unavailable", `Google's token server answered ${response.status}`);
}

/** An auth client for the GA4 libraries, holding one access token (from withGoogleToken). */
export function authClientFor(accessToken: string): OAuth2Client {
  const client = new OAuth2Client();
  client.setCredentials({ access_token: accessToken });
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
