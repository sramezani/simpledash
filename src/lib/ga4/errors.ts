import { GoogleAccessError } from "@/lib/auth/google-errors";

/**
 * Google's errors in our words (docs/SPEC.md section 10.4). The REST transport
 * gives a gRPC `code` and an `httpStatusCode`; both are checked.
 */
export type Ga4Problem = "revoked" | "no_access" | "quota" | "unavailable" | "bad_request";

export type ClassifiedError = { problem: Ga4Problem; quota?: "hourly" | "daily"; message: string };

const GRPC = {
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  UNAUTHENTICATED: 16,
} as const;

export function classifyError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof GoogleAccessError) {
    return { problem: error.problem === "unavailable" ? "unavailable" : "revoked", message };
  }
  const e = (error ?? {}) as {
    code?: unknown;
    httpStatusCode?: unknown;
    reason?: unknown;
    name?: unknown;
  };
  const code = typeof e.code === "number" ? e.code : undefined;
  const http = typeof e.httpStatusCode === "number" ? e.httpStatusCode : undefined;

  if (code === GRPC.RESOURCE_EXHAUSTED || http === 429) {
    // Too many requests at once clears in seconds: not worth blocking the site for an hour.
    if (/concurrent/i.test(message)) return { problem: "unavailable", message };
    return {
      problem: "quota",
      quota: /per ?day|daily/i.test(message) ? "daily" : "hourly",
      message,
    };
  }
  // Only Google's token server can say access ended (GoogleAccessError above, or its
  // invalid_grant). A 401 from an API is a turned-down token that a new one didn't fix
  // (withGoogleToken already tried): not lost access, so try again later.
  if (/invalid_grant/.test(message)) return { problem: "revoked", message };
  if (code === GRPC.UNAUTHENTICATED || http === 401) return { problem: "unavailable", message };
  if (code === GRPC.PERMISSION_DENIED || http === 403) {
    // A disabled API is our project's setup, not the user's lost access.
    if (
      e.reason === "SERVICE_DISABLED" ||
      /has not been used in project|is disabled/i.test(message)
    ) {
      return { problem: "unavailable", message };
    }
    return { problem: "no_access", message };
  }
  if (code === GRPC.NOT_FOUND || http === 404) return { problem: "no_access", message };
  if (code === GRPC.INVALID_ARGUMENT || http === 400) return { problem: "bad_request", message };
  return { problem: "unavailable", message };
}

/** Worth one retry: server errors and timeouts. */
export function isRetryable(error: unknown): boolean {
  const e = (error ?? {}) as { code?: unknown; httpStatusCode?: unknown };
  if (error instanceof GoogleAccessError) return false;
  const message = error instanceof Error ? error.message : "";
  if (
    (e.code === GRPC.RESOURCE_EXHAUSTED || e.httpStatusCode === 429) &&
    /concurrent/i.test(message)
  ) {
    return true;
  }
  const code = typeof e.code === "number" ? e.code : undefined;
  const http = typeof e.httpStatusCode === "number" ? e.httpStatusCode : undefined;
  if (code === GRPC.UNAVAILABLE || code === GRPC.INTERNAL || code === GRPC.DEADLINE_EXCEEDED)
    return true;
  if (http !== undefined && http >= 500) return true;
  return code === undefined && http === undefined && classifyError(error).problem === "unavailable";
}

/** When a quota block ends: the next full hour, or midnight in California for the daily quota. */
export function quotaBlockedUntil(quota: "hourly" | "daily", now: Date = new Date()): Date {
  if (quota === "hourly") {
    const next = new Date(now);
    next.setUTCMinutes(0, 0, 0);
    next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }
  // Pacific midnight: step forward hour by hour until the date in Los Angeles changes.
  const dateIn = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      dateStyle: "short",
    }).format(d);
  const today = dateIn(now);
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  while (dateIn(next) === today) next.setUTCHours(next.getUTCHours() + 1);
  return next;
}
