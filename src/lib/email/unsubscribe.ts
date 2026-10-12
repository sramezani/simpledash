import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One-click unsubscribe tokens (docs/SPEC.md section 14): the user ID and an HMAC
 * of it, signed with EMAIL_TOKEN_SECRET. Pure (the secret is passed in), so it is tested.
 */

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");
const sign = (userId: string, secret: string) =>
  createHmac("sha256", secret).update(`unsubscribe:${userId}`).digest();

export function unsubscribeToken(userId: string, secret: string): string {
  return `${b64(userId)}.${b64(sign(userId, secret))}`;
}

/** The user ID in a valid token, or null. */
export function verifyUnsubscribeToken(
  token: string | null | undefined,
  secret: string,
): string | null {
  if (!token || token.length > 512) return null;
  const [idPart, sigPart] = token.split(".");
  if (!idPart || !sigPart) return null;
  const userId = Buffer.from(idPart, "base64url").toString("utf8");
  if (!userId || b64(userId) !== idPart) return null;
  const given = Buffer.from(sigPart, "base64url");
  const expected = sign(userId, secret);
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}
