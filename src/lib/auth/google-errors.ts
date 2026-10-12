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
