# Google search insights (Search Console)

The Google search card on Pro: this week's one page to work on, and five views from the user's own Search Console data. The plan is in `docs/SPEC.md` sections 28.2 and 31.3; this file says how the code does it.

**Rule:** only `src/lib/search-console/` calls the Search Console API, with `fetch` and the user's own access token. Pages and actions use its functions.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `window.ts` | Which days to ask for: California time, Google's newest finished day, the dashboard's period moved back to end there, the period before, the 16-month limit | yes |
| `match.ts` | The site's property: its own domain property, then a URL property, then a parent domain property (with a page filter for the site's host) | yes |
| `brand.ts` | The site's name in searches: from the domain plus the user's spellings, as a Search Console pattern | yes |
| `insights.ts` | The views: close to page 1, what changed, seen but not clicked, brings signups; the searches per page and "slipping". Page paths and labels | yes |
| `action.ts` | This week's pick: the rules, the week's Monday, the facts as sentences, the fixed steps, the note text | yes |
| `reports.ts` | The requests behind each report and how the responses become small payloads | yes |
| `client.ts` | `sites.list` and `searchAnalytics.query` over `fetch`, 20-second timeout, errors in our words | |
| `data.ts` | The cache: `loadSearch(site, range)` for the dashboard card, `loadWeeklyPick(site)` for this week's pick and its follow-up | `loadSearch` checked once against a local database |
| `connect.ts` | Linking a site to a property (picked automatically, or chosen in Settings), name spellings, disconnect | |
| `sample.ts` | Sample data for the dev previews, made by running the real parsers over made-up rows | yes |

UI: `src/components/search/` (`SearchCard`, `SearchActionPanel` and its client part `SearchActionPicker`, and `SearchConnect`, `SearchTeaser`, `SearchProblemCard`, `SearchSkeleton`), `src/components/settings/search-console-settings.tsx` and `brand-terms-form.tsx`, `src/components/charts/stacked-bars.tsx`. Actions: `src/app/actions/search-console.ts`. The return from Google: `src/app/api/search-console/connected/route.ts`.

## Connecting

1. Settings → Google Search Console (or the dashboard's "Connect Search Console" card), Pro only.
2. Without the scope yet: Better Auth's link flow (`linkGoogleScope` in `src/lib/auth/link-scope.ts`, never a server action, with a fixed list of the two read-only scopes) sends the user to Google with `webmasters.readonly`. Better Auth merges it into `account.scope` and saves the new tokens; our database hook drops the cached access token so the next call carries the new scope.
3. Google returns to `/api/search-console/connected?site=…&back=…`, which picks the matching property (`autoConnect`) and goes back with `?search=connected` or `no_match`.
4. With the scope already granted (another site), Connect picks the property straight away.
5. The user can pick another of their own properties in Settings; the server checks it's in their `sites.list` first. Disconnect sets `site.search_console_url` back to null for that site only.

The same link flow now backs "Allow access" for Analytics: a plain sign-in never updates the stored scope, so before this the "Analytics access not granted" state could loop.

## Loading the card

`loadSearch(site, range)`:

1. Google's newest finished day: a query by date over the last 10 California days, cached 6 hours (`search_latest`).
2. The window: the dashboard's period moved back to end on that day, same length; the period before just before it. No day older than 16 months is asked for (then there's no comparison, and the card says Search Console keeps 16 months).
3. Three reports from `report_cache` (rows keyed on the GA4 property, the dashboard's range, and the property, page filter and name spellings), each holding its own window:
   - `search_overview`: totals for both periods (no dimension) and clicks and impressions per day.
   - `search_insights`: searches by page and pages, both periods, 25,000 rows each, worked into the views at fetch time; only the top rows are stored.
   - `search_brand`: clicks per day with the name pattern (`includingRegex`) and without it (`excludingRegex`), and both totals for the period before.
4. Fresh for 12 hours when the window still matches; otherwise shown at once and refreshed after the response (with the cache's lease), like GA4 reports. Missing reports are fetched now (12 calls for a new window, in parallel).
5. For "Brings signups", two GA4 reports for the same days through the normal GA4 cache: `search_landing` (visitors from Google search per landing page) and `search_signups` (the signup event per landing page), both filtered to `sessionSource` = google and `sessionMedium` = organic. A GA4 list cut off at 250 pages means a missing page is unknown (—), not zero.

The insights payload also holds `pageQueries`: the 100 pages with the most clicks, each with its 8 most-seen searches then and now. It's worked out from the same rows, so it costs no extra calls. Its cache key carries `v=2`.

## This week's pick

`loadWeeklyPick(site)` (Pro with a property; the dashboard and the Monday email):

1. **The week:** this week's Monday in the site's time zone (`weekStart`). The pick is cached in `report_cache` under `week:<Monday>` as a `search_insights` row for the last 28 finished Search Console days. The first load in a week fetches it, and every later load that week reads it (the daily clean-up removes it after 7 days).
2. **Signups:** GA4's `search_signups` for the same 28 days (a custom range, through the GA4 cache), when a signup event is set.
3. **Recent work:** chart notes with a `search_page` from the last 56 days (`listSearchActionNotes`). Pages worked on in the last 28 days are skipped. A note this week means "done".
4. **The rules** (`weeklyActions`): pages with Google signups first (slipping, then close to page 1 with a search at 8–15 seen 100 times or more, then seen but not clicked), then the same for any page. One per page, up to 3.
5. **Follow-up:** the newest note from before this week, once 7 days of data exist after it, gets `search_followup` (that page and search, equal days before and since, at most 28; cached under `note:<id>` with the newest day in the key).

**Mark as done** (`markSearchActionDoneAction`): Pro only. It loads the pick again and accepts only a page that is one of this week's candidates, then adds a chart note dated today ("Worked on /path", 80 characters at most) with `search_page` (the page address) and `search_query`. Migration `0008`.

## Errors

| Search Console says | Problem | The card says |
| --- | --- | --- |
| 401, or the Google token can't be refreshed | `revoked` (every site is marked `needs_reconnect`, as for GA4) | "Google access ended" |
| 403 "insufficient authentication scopes" | `scope` | "SimpleDash can't read Search Console any more" with "Allow Search Console access" |
| 403 for the property | `no_access` | "This Google account can't open that property any more" with a link to Settings |
| 403 "API not used in project / disabled" | `unavailable` (our setup: turn on the Search Console API) | "Search Console isn't answering" |
| 429 | `quota` | "Google's Search Console limit was reached for now" |
| 5xx, timeout | `unavailable` | "Search Console isn't answering" |

With older numbers cached, the card shows them with a one-line note instead.

## What's honest on screen

- The card prints its own dates, and "Google is 2–3 days behind" when they were moved back.
- "Your name vs others" says the two add up to less than all Google clicks, because Google leaves out searches made by very few people (anonymized queries are dropped from any query-filtered total).
- "Seen, not clicked" compares a page only with the site's own pages at about the same position, and says when there isn't enough data to compare.
- "What changed" shows clicks and positions then and now, and says when the searches behind a change are ones Google hides. No reasons, ever.
- Words: Clicks, Seen (impressions), Click rate (CTR), Position (average position), searches (queries). "Page 2" only next to its position.

## Previews

`/ui-kit/dashboard?state=pro` (the card on sample data with this week's pick; switch tabs, Show another, Mark as done), `state=search-done` (the done state), `state=search-connect`, `state=search-error`, `state=normal` (the Free teaser). `/ui-kit/settings?state=pro|search-off|search-pick|trial` (the Settings card).

## Google's side (Siamak)

- Turn on the **Google Search Console API** in the Cloud project.
- Add `webmasters.readonly` to the OAuth consent screen and the verification request (`docs/google-verification.md`).
