# Sign-in and Google access

How sign-in works. The plan is in `docs/SPEC.md` section 6.

## Better Auth

`src/lib/auth/auth.ts` sets up Better Auth 1.7:

- **Google only**, no email and password.
- **Scopes:** `openid`, `email`, `profile` (Better Auth's defaults) plus `analytics.readonly` (`src/lib/auth/scopes.ts`).
- `accessType: "offline"` and `prompt: "select_account consent"`, so Google sends a refresh token every time.
- **Tokens are encrypted** in the `account` table (`encryptOAuthTokens`, XChaCha20-Poly1305 keyed by `BETTER_AUTH_SECRET`). Rotating that secret means everyone has to reconnect.
- `updateAccountOnSignIn`: the newest tokens replace the old ones at every sign-in.
- **Sessions:** in the database, 30 days, renewed daily, with a 5-minute cookie cache. Secure cookies when `APP_URL` is https.
- A **database hook** sets sites from `needs_reconnect` back to `ok` whenever new Google tokens are stored.
- `nextCookies()` lets server actions set Better Auth's cookies.

The instance is created on first use (`lazyObject` in `src/lib/lazy.ts`), so `next build` doesn't need the secrets.

## Routes and actions

| What | Where |
| --- | --- |
| Better Auth's endpoints (callback, sign-out, ...) | `src/app/api/auth/[...all]/route.ts` |
| "Continue with Google", "Allow access", "Reconnect Google" | `signInWithGoogle` server action (`src/app/actions/auth.ts`), a plain form post, no JavaScript needed |
| Sign out | `signOut` server action |
| Signed-out visitors to `/dashboard` or `/settings` | `src/proxy.ts` sends them to `/signin` (an optimistic cookie check) |

After Google, the callback goes to `/dashboard`. Errors go to `/signin?error=…`, which shows a short message.

## Access checks

`src/lib/auth/session.ts`:

- `getSession()`: the session, read once per request.
- `requireUser()`: at the top of every signed-in page and server action. Redirects to `/signin`.
- `getActiveSite(userId)`: the user's one active site, or null.
- `requireSite()`: the user and their active site, or a 404. Never takes a property ID from the browser.
- `getApiUser()`: for route handlers that answer 401 instead of redirecting.

The only place a property ID comes from the browser is the switcher, and `switchProperty` checks it against the user's own live list first.

## Google access tokens

`src/lib/auth/google.ts`:

- `getGoogleAccessToken(userId)` asks Better Auth (`auth.api.getAccessToken`), which refreshes the token when needed. Jobs call it with the site owner's user ID.
- The token is kept in memory (`token-cache.ts`) for at most 10 minutes, and never past a minute before Google says it runs out. Better Auth returns its stored token until 5 seconds before the end, so one with less than a minute left is swapped for a new one from Google's token endpoint first.
- `withGoogleToken(userId, call)` runs every Google API call (GA4 Data and Admin, Search Console). If Google answers 401 (the token ran out early or was replaced), it asks the token endpoint for a new token and runs the call once more. Parallel calls that hit the same 401 share one new token (`replaceToken`). A 401 is never "access ended" by itself.
- Better Auth doesn't say **why** a refresh failed. So on failure we decrypt the refresh token with Better Auth's own key (`symmetricDecrypt` from `better-auth/crypto`) and ask Google's token endpoint directly:
  - `invalid_grant` → `GoogleAccessError("revoked")` → the "Google access ended" state. This is the only way a site gets there from a Google call.
  - Anything else (network, 5xx) → `GoogleAccessError("unavailable")`: try again later, not a reconnect.
- `authClientFor(token)` wraps one token in an `OAuth2Client` for the GA4 libraries (`withDataClient` and `withAdminClient` in `src/lib/ga4/clients.ts`).
- `revokeGoogleAccess(userId)` revokes the grant at Google (disconnect and account deletion).

Tokens never leave the server and are never logged.

## Disconnect and delete (Settings)

`src/lib/account/account.ts` and the actions in `src/app/actions/account.ts`:

- **Disconnect Google:** sign out this browser, revoke the grant at Google, clear the tokens on the `account` row, set every site to `needs_reconnect`, delete cached reports no other user's site needs, and end every session of the user. Settings, notes, the signup event and the public page's slug stay. Signing in again stores new tokens, and the database hook sets the sites back to `ok`.
- **Delete account** (type DELETE): cancel the Stripe subscription first and stop if that fails, revoke Google, delete the `user` row (every table cascades), delete unneeded caches, drop the public page's cached copy, sign out, and show `/account-deleted`.
- `endCurrentSession()` (`src/lib/auth/session.ts`) signs out through Better Auth. Only when that fails (the session row is already gone) does it expire the cookies by hand, with `Secure` for the `__Secure-` ones; otherwise the 5-minute session cookie cache could keep a deleted account looking signed in.

## Scope check

Google lets people untick the Analytics box. The dashboard reads the Google `account.scope` and, without `analytics.readonly`, shows "SimpleDash needs read-only access to Google Analytics" with an "Allow access" button that starts the Google flow again.

## Google Cloud setup (Siamak)

- Enable the **Google Analytics Data API** and **Google Analytics Admin API** in the project.
- OAuth consent screen: External, app name SimpleDash, support email, `simpledash.app` as an authorised domain, the privacy and terms URLs, scopes `openid`, `email`, `profile` and `analytics.readonly`.
- Web client redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://simpledash.app/api/auth/callback/google`
- Publish the app **"In production"** (unverified) so refresh tokens don't expire after 7 days.

## More scopes later (V2)

Better Auth only updates `account.scope` through its **link flow** (`linkSocial`), never on a plain sign-in. So an extra read-only scope is asked for with `linkGoogleScope` (`src/lib/auth/link-scope.ts`): server code only, never a server action, with a fixed list of our two scopes (`analytics.readonly`, `webmasters.readonly`). Google shows one consent screen (`include_granted_scopes`), Better Auth merges the new scope and saves the new tokens, and the account hook in `auth.ts` drops the cached access token (`src/lib/auth/token-cache.ts`) so the next call carries it.

- **Search Console** (Pro): "Connect Search Console" (`docs/search-console.md`).
- **"Allow access"** (Analytics unticked at sign-in) uses the same flow since Sprint 6. Before, a second sign-in left the old scope in place and the state could loop.
- The user must pick the same Google account on Google's screen: Better Auth refuses to link a different email, and we show "access wasn't granted".

Pasted Stripe keys (Pro, `docs/revenue.md`) are encrypted with the same key as the Google tokens (`src/lib/auth/secrets.ts`).
