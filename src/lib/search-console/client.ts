import "server-only";
import { getGoogleAccessToken } from "@/lib/auth/google";
import { GoogleAccessError } from "@/lib/auth/google-errors";
import { classifyError } from "@/lib/ga4/errors";
import type { ScSite } from "./match";
import type { ScRequest, ScResponse } from "./reports";

/**
 * The only code that calls the Search Console API (docs/SPEC.md section 28.2), with
 * `fetch` and the user's own access token: no client library.
 */

const BASE = "https://www.googleapis.com/webmasters/v3";
const TIMEOUT_MS = 20_000;

export class SearchConsoleError extends Error {
  constructor(
    message: string,
    readonly httpStatusCode: number,
    readonly reason?: string,
  ) {
    super(message);
    this.name = "SearchConsoleError";
  }
}

/** Why Search Console couldn't be asked, in our words. */
export type SearchProblem =
  "revoked" | "scope" | "no_access" | "quota" | "unavailable" | "bad_request";

export function classifySearchError(error: unknown): SearchProblem {
  if (error instanceof GoogleAccessError) {
    return error.problem === "unavailable" ? "unavailable" : "revoked";
  }
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof SearchConsoleError && error.httpStatusCode === 403) {
    // The token doesn't carry the Search Console scope (it was unticked, or removed).
    if (
      /insufficient (authentication )?scopes|insufficientPermissions|SCOPE_INSUFFICIENT/i.test(
        `${message} ${error.reason ?? ""}`,
      )
    ) {
      return "scope";
    }
  }
  const problem = classifyError(error).problem;
  return problem;
}

async function call<T>(userId: string, path: string, body?: unknown): Promise<T> {
  const token = await getGoogleAccessToken(userId);
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new SearchConsoleError("Search Console didn't answer", 503);
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (
      json as {
        error?: { message?: string; status?: string; errors?: { reason?: string }[] };
      } | null
    )?.error;
    throw new SearchConsoleError(
      error?.message ?? `Search Console answered ${response.status}`,
      response.status,
      error?.errors?.[0]?.reason ?? error?.status,
    );
  }
  return json as T;
}

/** The Search Console properties the user's Google account can see. */
export async function listSearchConsoleSites(userId: string): Promise<ScSite[]> {
  const body = await call<{ siteEntry?: ScSite[] }>(userId, "/sites");
  return (body.siteEntry ?? []).filter((e) => typeof e.siteUrl === "string");
}

/** One Search Analytics query for a property. */
export function querySearchAnalytics(
  userId: string,
  siteUrl: string,
  request: ScRequest,
): Promise<ScResponse> {
  return call<ScResponse>(
    userId,
    `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    request,
  );
}
