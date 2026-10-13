import "server-only";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { auth } from "./auth";

/**
 * Secrets at rest (docs/SPEC.md sections 6 and 28.3): Google tokens and pasted Stripe
 * keys are encrypted with Better Auth's key (`BETTER_AUTH_SECRET`). If that secret
 * changes, stored secrets can't be read and users connect again.
 */

export async function encryptSecret(value: string): Promise<string> {
  const ctx = await auth.$context;
  return symmetricEncrypt({ key: ctx.secretConfig, data: value });
}

/** Null when it can't be read (e.g. the secret changed). */
export async function decryptSecret(value: string): Promise<string | null> {
  const ctx = await auth.$context;
  try {
    return await symmetricDecrypt({ key: ctx.secretConfig, data: value });
  } catch {
    return null;
  }
}
