import "server-only";
import * as Sentry from "@sentry/nextjs";

type Context = Record<string, string | number | boolean | null | undefined>;

/**
 * Reports a server error: logged, and sent to Sentry when SENTRY_DSN is set.
 * Never pass tokens, secrets or email addresses in the context.
 */
export function reportError(message: string, error: unknown, context: Context = {}) {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[simpledash] ${message}: ${detail.slice(0, 500)}`, context);
  if (Sentry.isEnabled()) {
    Sentry.captureException(error, { tags: { where: message.slice(0, 200) }, extra: context });
  }
}
