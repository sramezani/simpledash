/** The Google scope SimpleDash asks for at sign-in, on top of openid, email and profile. Read-only. */
export const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/**
 * Asked for only when a Pro user connects Search Console (docs/SPEC.md section 28.2).
 * Read-only.
 */
export const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/** The scopes stored on the Google account (Better Auth joins them with commas). */
function granted(scope: string | null | undefined): string[] {
  return scope ? scope.split(/[\s,]+/) : [];
}

/** Google lets people untick scopes on the consent screen, so we check what was granted. */
export function hasAnalyticsScope(scope: string | null | undefined): boolean {
  return granted(scope).includes(ANALYTICS_SCOPE);
}

export function hasSearchConsoleScope(scope: string | null | undefined): boolean {
  return granted(scope).includes(SEARCH_CONSOLE_SCOPE);
}
