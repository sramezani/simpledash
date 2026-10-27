/** Why a Google access token couldn't be had. Kept separate from google.ts so it is easy to test. */
export type GoogleAccessProblem = "no_account" | "revoked" | "unavailable";

export class GoogleAccessError extends Error {
  constructor(
    readonly problem: GoogleAccessProblem,
    message: string = problem,
  ) {
    super(message);
    this.name = "GoogleAccessError";
  }
}

/** Google's token endpoint says the grant is gone: revoked, expired or unused for 6 months. */
export function isRevokedGrant(body: unknown): boolean {
  const error = (body as { error?: unknown } | null)?.error;
  return error === "invalid_grant" || error === "unauthorized_client";
}

/**
 * Google turned the access token down (HTTP 401, gRPC UNAUTHENTICATED): it ran out early
 * or was replaced. That isn't lost access: a new token usually works. Access has only
 * ended when Google's token server refuses the grant (GoogleAccessError "revoked").
 */
export function isRejectedToken(error: unknown): boolean {
  if (error instanceof GoogleAccessError) return false;
  const e = (error ?? {}) as { code?: unknown; httpStatusCode?: unknown };
  return e.code === 16 || e.httpStatusCode === 401;
}

/** Runs a Google call with a token, and once more with a new one if Google turns it down. */
export async function withTokenRetry<T>(
  getToken: () => Promise<string>,
  replaceToken: (stale: string) => Promise<string>,
  call: (token: string) => Promise<T>,
): Promise<T> {
  const token = await getToken();
  try {
    return await call(token);
  } catch (error) {
    if (!isRejectedToken(error)) throw error;
    return call(await replaceToken(token));
  }
}
