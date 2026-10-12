/**
 * Better Auth endpoints reachable over HTTP. Sign-in and sign-out run as server
 * actions (auth.api on the server), so the browser only needs Google's callback.
 * Everything else, such as /get-access-token or /refresh-token (which would hand
 * Google tokens to the browser), answers 404. Tokens never leave the server.
 */
const PUBLIC_AUTH_PATHS = new Set(["/api/auth/callback/google", "/api/auth/error"]);

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.has(pathname.replace(/\/+$/, ""));
}
