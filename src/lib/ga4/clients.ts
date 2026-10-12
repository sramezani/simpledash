import "server-only";
import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { BetaAnalyticsDataClient, type protos } from "@google-analytics/data";
import { getGoogleAuthClient } from "@/lib/auth/google";
import { isRetryable } from "./errors";
import { recordQuota, recordServerError, withPropertySlot } from "./limiter";

/**
 * The only place that creates Google Analytics clients (docs/SPEC.md section 10.1).
 * Clients are made per request with the user's token, over REST (`fallback: true`).
 */

type RunReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;
type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse;

const TIMEOUT_MS = 15_000;
const callOptions = { timeout: TIMEOUT_MS, retry: null } as const;

export async function dataClient(userId: string) {
  return new BetaAnalyticsDataClient({
    authClient: await getGoogleAuthClient(userId),
    fallback: true,
  });
}

export async function adminClient(userId: string) {
  return new AnalyticsAdminServiceClient({
    authClient: await getGoogleAuthClient(userId),
    fallback: true,
  });
}

/** Retries once, after about a second, on server errors and timeouts. */
async function withOneRetry<T>(propertyId: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!isRetryable(error)) throw error;
    recordServerError(propertyId);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    try {
      return await call();
    } catch (retryError) {
      if (isRetryable(retryError)) recordServerError(propertyId);
      throw retryError;
    }
  }
}

/** Runs up to 5 reports for one property in a single batch call. */
export async function runReportBatch(
  userId: string,
  propertyId: string,
  requests: RunReportRequest[],
): Promise<RunReportResponse[]> {
  if (requests.length === 0) return [];
  if (requests.length > 5) throw new Error("A GA4 batch holds at most 5 reports");
  const client = await dataClient(userId);
  const [response] = await withPropertySlot(propertyId, () =>
    withOneRetry(propertyId, () =>
      client.batchRunReports(
        {
          property: propertyId,
          requests: requests.map((r) => ({ ...r, returnPropertyQuota: true })),
        },
        callOptions,
      ),
    ),
  );
  const reports = response.reports ?? [];
  recordQuota(propertyId, reports.at(-1)?.propertyQuota);
  return reports;
}

/** A single report, used where a batch isn't needed (property choice). */
export async function runSingleReport(
  userId: string,
  propertyId: string,
  request: RunReportRequest,
  timeoutMs = TIMEOUT_MS,
): Promise<RunReportResponse> {
  const client = await dataClient(userId);
  const [response] = await withPropertySlot(propertyId, () =>
    client.runReport({ ...request, property: propertyId }, { timeout: timeoutMs, retry: null }),
  );
  return response;
}
