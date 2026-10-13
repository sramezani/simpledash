# GA4 data layer

How SimpleDash reads Google Analytics. The plan is in `docs/SPEC.md` sections 7, 8 and 10; this file says how the code does it.

**Rule:** only `src/lib/ga4/` talks to Google Analytics. Pages, the email and jobs call its functions. No other code imports the Google clients.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `ranges.ts` | Date ranges per time zone: 7 days, 30 days, 12 months, the previous period, chart detail, series keys, "not enough history" | yes |
| `reports.ts` | The 11 reports: how each request is built and how each response becomes a small payload | yes |
| `labels.ts` | GA4 values in plain words: `(direct)` → Direct, channels, devices, source → icon domain | yes |
| `ai-sources.ts` | The AI assistant list and names, and its version (part of the cache key) | yes |
| `errors.ts` | Google's errors in our words, retry rules, when a quota block ends | yes |
| `limiter.ts` | Per property: at most 5 requests at once, the server-error breaker, low-quota memory | yes |
| `cache.ts` | Cache logic: fresh, stale or missing; background refresh with a lease; error effects | yes, with fakes |
| `data.ts` | The cache wired to Postgres, GA4 and `after()`: `loadReports()` and `warm()` | |
| `clients.ts` | Creates the Google clients per request (REST transport), batches, one retry, timeouts | |
| `properties.ts` | Lists properties, picks one automatically, connects and switches | |
| `property-choice.ts` | Pure helpers for the choice: busiest property, host name, timestamps | yes |
| `derive.ts` | The four numbers from cached totals: % change, Avg. time, Signups | yes |
| `sample/sample.ts` | Sample data shaped like a small SaaS site, for the landing demo and the "no GA4" state | yes |
| `live.ts`, `realtime.ts`, `geo/` | Live data for the globe: parsing (tested), fetching with a 60-second cache, places to coordinates (tested) | partly |

## Reading reports

```ts
const result = await loadReports(site, "7d", ["totals", "sources"]);
result.reports.totals.data   // the payload, or null
result.reports.totals.fresh  // false when it's being refreshed
result.refreshing            // a background refresh started: reload the data once, ~4 s later
result.problem               // "revoked" | "no_access" | "quota" | "unavailable" | "bad_request" | null
result.quotaUntil            // when a quota block ends
```

What happens inside (`getReports` in `cache.ts`):

1. Work out the window for the range in the site's time zone (`rangeWindow`).
2. Read the cache rows. The key is property, report, range and `params_hash` (the signup event for Actions, the AI list version for the AI reports).
3. A row is **fresh** when its window matches today's window and it was fetched within 3 hours (7 and 30 days), 24 hours (12 months) or 12 hours (public pages).
4. **Missing** rows are fetched right away. **Stale** rows are shown at once, and a refresh is scheduled with `after()`. It takes a 30-second lease, so only one refresh runs at a time.
5. Sites that can't be fetched (access ended, lost access, quota block, breaker open) are never sent to Google; their cached rows are still shown.

Reports go to Google in `batchRunReports` calls of up to 5. Every request asks for `returnPropertyQuota`; when less than 10% of the hourly tokens are left, background refreshes stop until the hour turns.

## Errors

| Google says | Code | Effect | User sees |
| --- | --- | --- | --- |
| 429, `RESOURCE_EXHAUSTED` | 8 | `site.quota_blocked_until` = next hour, or Pacific midnight for the daily quota | Quota banner with the time it clears |
| 401, `UNAUTHENTICATED`, `invalid_grant` | 16 | Every site of the user: `status = needs_reconnect` | "Google access ended" banner, numbers greyed |
| 403, `PERMISSION_DENIED` (not a disabled API) | 7 | `status = no_access` | "You no longer have access" banner with the switcher |
| 403 because our API is disabled | 7 | Logged as an error | "Google Analytics isn't answering" |
| 500, 503, timeout | 13, 14, 4 | One retry after about 1 s; counted for the breaker (5 an hour) | Cached numbers, or "isn't answering" |

How states clear on their own:

- `needs_reconnect` → `ok` when Better Auth stores new Google tokens (sign-in or a successful refresh), through a database hook in `src/lib/auth/auth.ts`.
- `no_access` → `ok` when the dashboard sees the property in the user's list again.
- A quota block simply ends at its time.

## Several sites (Sprint 5)

A user's sites are `site` rows; `added_at` set means the site is in their list and `is_active` marks the one the dashboard opens with (the one opened last). `src/lib/sites/` holds the rules:

- `access.ts` (pure, tested): the list in the order added, which sites the plan opens (Growth: every listed site up to 10; Starter and trials: the active one), the site a page shows (`chooseSite`: the one in `?site=`, or the active one; an unlisted or unknown ID is "missing"), and whether one more can be added.
- `sites.ts`: `getSiteContext(userId, requested)` (plan, list and choice, once per request), `markSiteOpened` (the dashboard calls it after the response), `removeSite`.
- `requireSite(siteId)` (`src/lib/auth/session.ts`) uses them: every action and route handler that takes a site ID checks it is the user's own, listed and open on their plan.
- Adding and switching go through `connectProperty(userId, propertyId, mode)` in `properties.ts`: `replace` (Starter, the first site) takes the active site's place in the list; `add` (Growth) joins it, with the limit checked under a per-user advisory lock so two quick clicks can't pass it. Both check the property is in the user's own Google list first.

## Property choice

`chooseFirstSite(userId)` runs on the first dashboard visit when the user has no site:

1. `listAccountSummaries` (page size 200, every page), keeping ordinary properties.
2. None: sample data and the "No GA4 property" banner. The answer is remembered for 5 minutes per user, so a refresh doesn't ask Google again straight away.
3. One: use it. More: `activeUsers` for the last 7 days for the first 20, 5 at a time, 5 s each; the busiest wins, ties go to the first.
4. `getProperty` and `listDataStreams` give the time zone, creation date, currency, service level and the web stream's host name ("Showing: mysite.com").
5. The site is saved as the user's one active site (a partial unique index allows only one).

The switcher (`switchSite` server action) checks the property against the user's own live list before switching. Switching back to an old site keeps its notes and signup event.

## Jobs

| Job | Code | What it does |
| --- | --- | --- |
| `warm-cache` | `src/lib/jobs/warm-cache.ts` | Hourly: for `ok`, unblocked sites in a list whose dashboard was opened in the last 24 hours (`site.last_viewed_at`, stamped at most hourly when a dashboard opens), fetch stale or missing 7-day reports, 3 sites at a time. Sites nobody opens aren't refreshed (Sprint 5: GA4 calls grow with sites) |
| `cleanup` | `src/lib/jobs/cleanup.ts` | Daily: report caches not fetched for 7 days, expired sessions and sign-in leftovers |

They run through `POST /api/internal/jobs/<job>` with `Authorization: Bearer <CRON_SECRET>`. Coolify calls them with `node scripts/run-job.mjs <job>` (see `docs/deploy.md`).

## Checked in Sprint 1

- **REST transport works:** `new BetaAnalyticsDataClient({ authClient, fallback: true })`. Errors arrive as `GoogleError` with a gRPC `code` and an `httpStatusCode`.
- Async paging methods warn that `autoPaginate` is ignored, so the code pages by hand with `autoPaginate: false` and `nextPageToken`.
- Over REST, enums can arrive as names or numbers and timestamps as `{ seconds }` or ISO strings. `enumIs()` and `toDate()` accept both.

## Live data (the globe)

`src/lib/ga4/realtime.ts` runs three Realtime API calls (the total, places by country and city, and live pages by title) and keeps the result in memory for 60 seconds per property. The dashboard renders it on the server first, then `/api/live` (signed in, own site only) serves it to the card's poll, about every 45 seconds while the tab is visible.

- `parseLive()` (`live.ts`, tested) turns rows into `{ total, places, pages, minutes }`. Realtime covers 30 minutes, or 60 on GA4 360.
- Places become coordinates with `locate()` (`geo/locate.ts`, tested): the city first (accents ignored, a few English names such as Cologne), otherwise the country's population-weighted centre. The table `geo/places.json` is built from GeoNames (CC BY 4.0) by `node scripts/build-places.mjs`.
- Live pages show page titles: the Realtime API has no page path.

## Chart notes

Notes live in `chart_note` (one row per note: site, day, up to 80 characters) and are never sent to GA4 or shown on public pages. `src/lib/notes/` reads and writes them, scoped to the site; the server actions in `src/app/actions/notes.ts` check the user's own active site first. On the 12-month chart a note sits on its month.

## CSV

`/api/csv/<card>?range=7d|30d|12m` (signed in, own site only) builds the file from the same cached reports (`src/lib/csv-cards.ts`), so there are no extra GA4 calls unless a report is missing. `src/lib/csv.ts` quotes by RFC 4180 and puts a `'` before cells that start like a spreadsheet formula. File name: `simpledash-<domain>-<card>-<start>-<end>.csv`.

## Dev preview

`/ui-kit/dashboard` (development only) shows the real dashboard on sample data in every state: `?state=no-property`, `revoked`, `quota`, `no-data`, and so on. Use it to check layouts without signing in.
