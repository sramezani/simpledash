/** The one Google scope SimpleDash asks for, on top of openid, email and profile. Read-only. */
export const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/** Google lets people untick scopes on the consent screen, so we check what was granted. */
export function hasAnalyticsScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return scope.split(/[\s,]+/).includes(ANALYTICS_SCOPE);
}
