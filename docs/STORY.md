# SimpleDash story

A dated log with one entry per session. **Newest entry first.**

It is written for future Claude sessions: read the latest entry before starting work. Ideas that fall outside the roadmap go here too (Working rule 5).

## 2026-10-27 · Session 18 · A footer whose word is a chart

### Done

- **Ideas first:** Siamak wanted a footer to market on X. Sketched letters-as-bars, a live sentence and the dash bending into a line, then looked through footer.design (giant cropped wordmarks, a last call above them, dark bands, live or moving elements). Siamak picked letters-as-bars with those patterns.
- **The footer** (`SiteFooter`, landing and legal pages), first a near-black band, then (Siamak: too dark next to the light site) the brand colour, in seven new `footer-*` tokens:
  - The tagline, "See my dashboard, free" on a new white `light` button variant, and three link columns.
  - A live band (`FooterBand`): SimpleDash's own live numbers sliding by, flags for countries, "Checked 6 minutes ago" (`TimeAgo`, a small client component with `useSyncExternalStore`). CSS only, with a pause switch made of a checkbox; still for reduced motion. Without live numbers it shows three still facts at the same height.
  - The word (`FooterWord`): "SimpleDash" edge to edge, cut at the bottom of the page, its 10 letters the last 10 days. A bar from zero behind each letter, the letter cut out of the bar and dim above it, the number and day on top (on a small dark backing, since a quiet day's label sits over its letter), today lighter. Each letter links to that day on the public page. Hover or keyboard focus dims the others and swaps the caption for a sentence ("Sunday 25 October: 254 visitors, the busiest of these 10 days"), all CSS.
  - The bars rise as the word scrolls in: a named view timeline, `clip-path` and `translate` only. Measured CLS 0 at 375 and 1440 px on the production build.
- **Data** (`getFooterStats`, `footer-data.ts`): SimpleDash's own public page (`src/config/footer.ts`, `simpledash-app`; the demo shows meetline.me, so it couldn't say "our numbers"). Only what that page shows. Last 10 points of its Last 30 days chart through the report cache; no number before the property existed; live band from `getLive`. Cached 10 minutes, tagged like the page, streamed in after the static shell (`connection()` in `Suspense`). `/`, `/privacy` and `/terms` now send the public `Cache-Control` and build as partly prerendered.
- **Checked:** `npm run check` (61 files, 499 tests); the production build; the cache headers; `/ui-kit/footer` (new, sample numbers in four states) at 375 and 1440 px with full-size headless Chrome shots, hover, a keyboard pass (that found the pause switch not pausing: fixed) and reduced motion; `getFooterStats` once with mocks in `.vitest/` (deleted).
- **Colour:** rendered deep indigo, brand blue and light lavender with the real footer; brand blue picked (lighter, still ends the page, the word becomes the brand; lavender blended into the page). Tokens renamed `inverse-*` → `footer-*`, since a white "brand" token read wrong.
- Spec section 17 (and 5, 18), seven decisions, `docs/ui.md`, `docs/public-page.md`, README and the checklist.

- **Second pass (Siamak):** kept the blue. Solid white bars felt old-fashioned, so the bars are frosted glass (a token gradient, `backdrop-blur`, a bright top edge) with the letter lit white inside and dim above. Letters are as wide as in the name, so the word fills the width (about 1.5 times bigger; `16cqw`, measured 1,270 of 1,392 px at 1440). A letter no longer links to the public page: it opens a native popover card (CSS anchor positioning) with the long day, an odometer number (`@starting-style` under `:popover-open`), the change from the day before (`Delta`; never for today) and its rank (`dayFacts`, tested), while a light streak crosses its glass. "See all our numbers" gone; "Click a letter" hint; "Open source on GitHub" and "Made by Sia" pills (`brand-icons.tsx`, `brand.makerName` / `makerUrl`); a soft radial glow. Checked at 375 and 1440 px, clicking, Enter and Esc, and the young-site and plain states.

- **Third pass (Siamak):** the GitHub and X pills open in a new tab. "Pricing" in the top bar and footer glides to the section: `scroll-behavior: smooth` (not for reduced motion) and `data-scroll-behavior="smooth"` on `<html>`. Measured in headless Chrome: 0 → 1,791 px in about 0.8 s, from the top bar and from the footer, again on repeat clicks; from `/privacy` it opens the landing page at pricing.

- **Fourth pass (Siamak):** Google verified the app's data access (Siamak's screenshot), so a "Works with" band (`works-with.tsx`) now says "Verified by Google" next to Read-only access, No tracking script and Open source, under Google Analytics 4, Search Console and Stripe as plain names (not "trusted by", no Google logos). How it works rebuilt (`how-it-works.tsx`): a pill, "Three steps to your numbers", three cards with HTML drawings (consent screen, the busiest site picked, one page with the visitors line drawing in), "01–03", and the reasons as one card with icon tiles; a soft glow and dot grid (`.how-glow`, `.how-dots`, `.how-line` in `globals.css`). Ids on every landing section. Footer letters soft until hovered, focused or opened. The troubleshooting page's "unverified app" note updated. Then, at Siamak's ask, pastel colour: violet, mint and sky (brand, `chart-4`, `chart-1`) per step panel, dot grid and reason tile, and the Works with icons in amber, blue and violet; text stays neutral. The demo frame's address bar now reads `simpledash.app/demo` and is a link to `/demo` in a new tab (`Link` with `target="_blank"`, so lint stays happy; on phones the hover arrow is hidden so the address fits). The cookie banner is now a full-width frosted bar along the bottom with its content lined up with the page (a full-width sheet on phones) that slides up; Siamak's idea of a blocking modal was talked down (it would cover the hero, clash with "No tracking script", and a cookie wall isn't allowed in the EU).

- **Public page address (Siamak):** always from the domain and not editable. `createPublicPage` makes it (`slugFromDomain`, numbered only when taken) for both the dashboard's "Turn on" and the first save in Settings; `savePublicPage` no longer takes an address, and Settings shows it read-only with Copy link. `slugProblem` and the old-address cache clearing are gone. The docs page's "Change the address" section was removed (no links pointed at it).

### Learned

- Next.js's `Link` does nothing when clicked while the address already matches (`/#pricing` after one click), so a hash link that must work every time is a plain `<a>`. The browser pane in the desktop app doesn't run smooth scrolling; measure it in headless Chrome.
- `@starting-style` reaches the descendants of a popover as it opens, so its digits can roll from 0 every time it opens, with no JavaScript.
- Classes in `globals.css` are unlayered, so they beat Tailwind utilities: a utility can't pause an animation that a `globals.css` class sets. Put such state rules next to the class.
- `cqw` in a property resolves against the nearest ancestor container, not the element itself: `.footer-word` is the container and `.footer-word-grid` reads the sizes.
- Filling the letters themselves misleads (short letters look fuller); a bar behind each letter in equal columns keeps it an honest bar chart.
- A `"use cache"` result in the static shell would be fetched during `next build`, where there is no database: hence the stream.
- The dev database has no `meetline-me` page either (the demo falls back to sample data there), so the real data path can't be seen locally without seeding.

### Next

- Siamak: turn on simpledash.app's public page with the address `simpledash-app` and the cards "Visitors over time" and "Right now" (plus Countries, Pages, Devices for the live band). Until then the footer shows the plain dim word.
- Lighthouse on the landing page and a legal page after deploy.
- Firefox: check the cards there after deploy (anchor positioning is newer; without it the card opens in the middle of the screen).
- Idea, not in the roadmap: a tiny "made with SimpleDash" footer badge users could put on their own sites, showing their live count (needs Siamak's yes).

## 2026-10-26 · Session 17, continued · A false "Google access ended", and deploys with SSH locked

### Done

- **Why the banner showed after a deploy:** Better Auth returns its stored Google access token until 5 seconds before it runs out, and `token-cache.ts` kept whatever it got for a fixed 10 minutes. A token picked up in its last 10 minutes (about 1 time in 6, and a fresh process after a deploy always picks one up) was used after Google had ended it. Google answered 401, `classifyError` called every 401 "revoked", and `markNeedsReconnect` set all of Siamak's sites to `needs_reconnect`. It cleared when the site menu asked for his property list: Better Auth refreshed the expired token, and the account hook set the sites back to `ok`.
- **Fix:**
  - The cache keeps a token until a minute before its expiry (at most 10 minutes), from Better Auth's `accessTokenExpiresAt` or the token endpoint's `expires_in`. A token with under a minute left is swapped for a new one first.
  - `withGoogleToken(userId, call)` runs every Google API call: `withDataClient` and `withAdminClient` in `clients.ts` (reports, realtime, the Admin API) and Search Console's `call()`. On a 401 it gets a new token from Google's token endpoint and runs the call once more; parallel calls share one new token (`replaceToken`).
  - `classifyError` only says "revoked" for the token server refusing the grant (`GoogleAccessError`, `invalid_grant`). A 401 that a new token doesn't fix is "unavailable" and goes to Sentry.
- **Tests:** `token-cache.test.ts` and `google-errors.test.ts` are new, and the error and cache tests were changed. The wiring in `google.ts` was checked once with Better Auth, the database and the token endpoint mocked (deleted after). `npm run check` passes (60 files, 476 tests).
- **Deploys with SSH locked to Siamak's IP:** went through the options (open 22 again, a Cloudflare Tunnel, Tailscale, opening Azure's rule during a deploy, the server pulling the build). A Cloudflare Tunnel fits best. Nothing was built; waiting for Siamak.

### Learned

- Better Auth's `getAccessToken` only refreshes when fewer than 5 seconds are left (`accessTokenExpired` in `better-auth/dist/api/routes/account.mjs`), and it returns `accessTokenExpiresAt`, so the cache can follow the real expiry.
- A 401 from a Google API means the access token was turned down. Only the token endpoint's `invalid_grant` says the grant itself is gone.

### Next

- Siamak: after the next deploy, check the banner doesn't come back. If a 401 ever survives a new token, Sentry gets "GA4 request failed".
- Siamak: pick a way to deploy with port 22 closed (a Cloudflare Tunnel is the suggestion), or open 22 to Any again as `docs/deploy.md` describes.

## 2026-10-24 · Session 17 · Live count in the overview, globe in the demo

### Done

Siamak's list, from three screenshots:

- **The live count moved into the overview**, as its last number: "● Right now 3" with "Open the globe →" under it in the link colour. The whole tile is the click area (the button's `::after` covers it), with a soft hover background and a focus ring; its ⓘ help sits above the click area and still opens on its own. `OverviewToolbar` no longer has a live slot; `OverviewCard` has `live`.
- **The numbers row wraps.** With the live count, Pro with Stripe has 7 cells and equal cells squeezed "New customers" onto two lines at 1440 px. Cells are now flex items that never get narrower than their label and number (`whitespace-nowrap`, no `min-w-0`): if they don't fit, the last ones move to a new row and fill it. Dividers sit on every cell's left and top; the row is pulled 1px up and left, so the card's edge hides the outer ones. The live tile lies flat (label, number, "Open the globe" at the right) when it's alone on a wide row (`@container/live`); its number follows the card (`@container/overview`, now named).
- **The early ask:** the dashboard asks for the count once more 5 seconds after it opens with `&fresh=1`, which takes a cached answer only if it's at most 5 seconds old (`LIVE_EARLY`, `getLiveCount(site, now, maxAge)`). Without the shorter age the server's 20-second cache would answer with the same number. Once per page load, not again after the live view closes. Not on public pages (their visitors aren't on the counted site).
- **Globe in `/demo` and the landing page:** production's demo shows sample data (yoursite.com; `meetline-me`'s public page is missing or paused there), and the sample left out Right now. `getDemoView` now returns `{ view, sample }`, the sample includes every public card, and `/demo` gives it `sampleLive`. The live view opens inside the landing page's demo frame. The frame's placeholder and the dashboard skeleton have 5 cells now.
- **Lighter sky:** `globe-space` #070B1D → #121936.
- **Panel footer:** "Updates every 20 seconds, from Google Analytics." removed; "Faces are for fun: visitors stay anonymous." and the credits stay.
- **Desktop icon:** Icons8's "display" is a digital number display (it read "00"). Our own monitor in their style is in `scripts/tech-icons/desktop.svg`, and `copy-tech-icons.mjs` copies it (the lint rule bans hex in scripts, so it's a file, not a string).
- **Docs:** `LiveEarly` code fact for content; dashboard, public page, realtime glossary and the GA4 check guide updated (dates moved to 24 Oct); 4 screenshots retaken (`dashboard-overview`, `signups-picker`, `live-view`, `public-stats-page`); spec sections 11, 11.8, 11.10 and 17, 5 decisions, README, checklist.
- **Checked:** `npm run check` (58 files, 456 tests). Screenshots at 375, 768, 1000 and 1440 px of the normal, Pro, quiet, loading and public states. Keyboard: Tab reaches the help, then the tile; Enter opens the view; Esc returns focus to the tile. The early ask's timing on a temporary page (4.9 s with `fresh=1`, then about 20 s; no second early ask after closing the view), and the cache's ages in a one-off `vi.mock` check (both deleted).

### Learned

- **A named container keeps unnamed queries working.** `@container/overview` still answers `@md:` inside it, until a nearer container appears. Inside the live tile (`@container/live`), the number uses `@md/overview:` to follow the card.
- **`container-type: inline-size` gives an element no min-content width**, so a flex cell with it needs an explicit `min-w-*` (`min-w-38` for the live tile).
- **Flex-wrap with `basis-0` still wraps** on min-content: a line breaks when the cells' minimum widths don't fit. That gives "move to a new row when there's no room" without counting cells.
- **Hiding the outer dividers:** pull the row `-mt-px -ml-px` inside a card with `overflow-hidden`; the first row's top lines and first column's left lines land under the edge.

### Problems

- The browser pane shows 1440 px scaled to 800 wide, too blurry for spacing; screenshots came from headless Chrome over DevTools (a scratch copy of the screenshot script's approach).
- Not signed in locally, and Google sign-in is Siamak's, so the early ask was checked on a temporary page against a fake endpoint, not the real dashboard.
- Lighthouse wasn't run (not installed here). The landing page itself only changed its demo placeholder; public pages only moved the live count into the overview.

### Next

- Siamak: on simpledash.app, open the dashboard and check you show up in Right now within about 5 seconds.
- Lighthouse on the landing page, `/demo` and a public page after deploy.
- Idea (not built): asking with `fresh=1` once when the tab comes back too, for an owner who opens their site in another tab after the dashboard. Would add one Google call per return.

## 2026-10-23 · Session 16, continued · Next.js security upgrade

### Done

- **Next.js and `eslint-config-next` 16.4.0 → 16.4.2** (Siamak's go-ahead). 16.0.0 to 16.4.0 have two critical remote code execution holes (image optimiser with SVGs; `use cache` functions returning typed arrays) and a Server Actions denial of service. Done with `npm install --save-exact`, not the `next upgrade --agent=security` command the build printed, so every change is visible in `package.json` and the lockfile. Decision logged (only 8 days after release, because it's a critical fix).
- `npm audit` no longer lists `next`. What's left (drizzle-kit, the shadcn command line, the lint config and their esbuild, micromatch and ip-address) are developer tools that never run in the app.

### Learned

- `next build` on 16.4.0 compiles and generates every page, then stops with a "SecurityFatalError" that asks to run its upgrade agent. The advisories are real (checked with `npm audit`); the fix is a normal patch install.

## 2026-10-22 · Session 16 · Stripe live, sign-in redirects, the live globe

### Done

- **Stripe live:** product, two prices, the webhook and the Customer Portal set up in the new live account; price IDs in `deploy/secrets/app.env` (Siamak pasted the keys himself). Test payment, webhook (3 delivered, 0 failed) and portal all worked.
- **Cancel fix:** Stripe's newer portal cancels with `cancel_at`, not `cancel_at_period_end`; `subscriptionFacts` now reads both, so Settings says "ends on" after a cancel.
- **Signed-in redirects:** `/signin` sends a signed-in browser to the dashboard (`src/proxy.ts`), the pricing buttons read "Open my dashboard" when signed in, and `requireUser()` sends a stale cookie to `/signin?expired=1` so the two can never loop.
- **Legal:** the pages name Koochak Art, Lauriergracht 116 D2, Amsterdam.
- **Live count and live globe** (Siamak's list, section 11.10):
  - "● 3 live" beside the date menu (dashboard, public pages, demo), one Realtime request every 20 seconds. The Right now card is gone.
  - The count opens the live view: a dialog with a MapLibre globe on a night sky, drawn faces per city (DiceBear Notionists, CC0), a card per marker, and a panel with the count, page views, signups, visitors per minute and tabs. Six Realtime requests every 20 seconds, only while it's open.
  - Map data is our own (`npm run globe:data`): Natural Earth 1:50m from `world-atlas`, label points from `polylabel`, Geist for the labels through MapLibre 6's `font-faces`. About 205 KB compressed, loaded only when the view opens.

### Learned

- **MapLibre 6's worker:** Turbopack doesn't follow MapLibre's own worker lookup; `setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href)` makes Turbopack emit it as a static file (dev and build).
- **MapLibre's CSS makes its container `position: relative`:** give it an inner `size-full` element inside a positioned wrapper, or the map is 0 px tall.
- **Natural Earth outlines cross 180°** (Russia, Fiji): flat tiles draw a stripe across the world. Unwrap the longitudes first (`src/lib/globe/antimeridian.ts`), but leave Antarctica, which circles the pole.
- **The Realtime API has no traffic source**, so the live view can't show referrers like DataFast's.
- **Headless WebGL** for screenshots: `--use-angle=swiftshader --enable-unsafe-swiftshader` (now in `npm run content:screenshots`).
- `@dicebear/core` 9.4.2 has an SVG injection advisory; 9.4.3 fixes it.

### Problems

- `npm run build` compiled and generated every page, then stopped with a Next.js message about a security vulnerability in Next 16.4.0 that asks to run `next upgrade --agent=security`. Not run: it's Siamak's call.
- I ran `git rm` on the three old globe files by mistake and unstaged them straight away (`git restore --staged`); nothing is staged.

### Next

- Siamak: check the live view with real visitors, and decide on the Next.js upgrade.
- Idea (outside the roadmap): show the live count in the browser tab title while the view is open.

## 2026-10-18 · Session 15, continued · Migrations on deploy, screenshots

### Done

- **Migrations:** production already applies new migrations when the container starts. `scripts/migrate.mjs` now says "applied N new migrations" or "nothing new". It was checked on a throwaway Postgres going from 0007 to 0008, then run again with nothing new. Docs and checklist no longer ask Siamak to run them on the server.
- **Honesty fixes after a review:** "Exact counts from GA4" in the sale setting became "as Google Analytics counts them". The What brings customers page now says GA4 itself can hold back small numbers or model for people who decline cookies.
- **11 docs screenshots** of SimpleDash's own screens, from the `/ui-kit` previews on sample data:
  - Each one is cropped to the part its page explains (a card, a menu, a settings section, the email), at twice screen size, as WebP (592 KB for all 11).
  - The dev address shows as `simpledash.app`, and neighbouring cards are hidden.
  - `npm run content:screenshots` retakes them, or one with `-- <id>`.
- **ImageSlot:**
  - Real sizes come from `image-sizes.json` (written by `npm run content:images`, tested against the files).
  - Images show at their natural width, capped at the column, with no layout shift.
  - New `caption` and `eager` props. Specific alt texts for the 11, with captions that say "sample data".

- **SimpleDash's own key events** (Google's recommended names; `docs/SPEC.md` section 17):
  - `sign_up` and `login` come from Better Auth's `newUserCallbackURL` vs `callbackURL` (`?auth=`).
  - `begin_checkout` is sent when the upgrade form is submitted.
  - `purchase` is sent only for a Stripe Checkout Session the server confirmed (the user's, complete, paid), with Stripe's amounts.
  - All behind the same consent: queued until the visitor chooses, dropped on Decline, never any personal data. The privacy page now says so (updated 18 Oct).
  - Checked in headless Chrome: granted logs `sign_up` and tidies the address; denied logs nothing; the yearly upgrade logs `begin_checkout` at 90 USD. The browser pane stopped hydrating pages this session (headless Chrome is fine), so use headless checks when that happens.

- **Privacy and terms:** no more `[...]` placeholders (SimpleDash, Amsterdam, the Netherlands; `operator()` in `src/config/legal.ts`, tested).
  - The terms now cover: information not advice, Google and Stripe, public pages, claims from misuse, wider liability limits (as is, a cap of 12 months' fees or $50, no indirect losses, one-year claims), ending the agreement, events outside our control, and Dutch law with the Amsterdam court.
  - The privacy page now has legal bases, security, children and the Autoriteit Persoonsgegevens.
  - Both pages updated 18 Oct.

### Learned

- Next.js copies the address back from its own state: clear search params with `history.replaceState(null, …)` (not the current state) and a tick after mount, or the router puts them back.
- Reading a file while a Cache Components page prerenders fails with a confusing "`Date.now()`" error. Keep build-time facts in a generated JSON file instead.
- `captureBeyondViewport` resizes the page for the shot, which moves anchored popovers and menus. Only use it when the crop is below the fold.
- Node 22.18 and later imports `.ts` files directly (type stripping), so scripts can reuse small typed helpers.
- npm adds `-- args` to the last command of an `&&` chain.

### Next

- Siamak: the 20 remaining screenshots (Google, Stripe, site builders), then `npm run content:images`.
- Next step (Siamak asked to wait): in GA4, mark `sign_up` and `purchase` as key events once they've arrived, and check them in DebugView.

## 2026-10-17 · Session 15 · Why people pay: customers, changes and one search fix a week

### Done

Siamak's feedback was that SimpleDash only repeated GA4, Search Console and Stripe ("as a user I still don't see why I should pay"). He approved a plan for three features, all from read-only data, whole counts only, never "because" (`docs/SPEC.md` section 31):

- **What brings customers** (Pro; replaces "Sales and signups by source", same card id `sales`):
  - Signups | Sales switch, with First visit (GA4 `firstUserSource`) next to Last visit (`sessionSource`) per source.
  - A Paths tab ("reddit.com → Google"), "Time from first visit" groups and landing pages.
  - Up to two highlight lines (`src/lib/customers/highlights.ts`), with the counting shared with the email (`counts.ts`).
  - New reports: `first_goals`, `goal_paths`, `goal_days`, `first_purchase` and their thank-you page versions, loaded in three separate calls so a GA4 refusal hides nothing.
- **What changed and where** (every plan; Signups and Sales on Pro), a card under the overview (`what-changed-card.tsx`, `src/lib/changes/breakdown.ts`):
  - A headline and the 3 biggest source moves, each a `<details>` row opening onto its landing pages.
  - For Google: Search Console's clicks and the searches' positions then and now, matched by page.
  - New reports: `change_paths`, `change_goals`, `change_sale_page`. Search Console is loaded once per request (`cache()`), shared with the search card.
- **Brings signups and This week** (Pro with Search Console):
  - `search_insights` now carries `pageQueries` (searches per page, then and now; cache key `v=2`).
  - The **Brings signups** tab is first when a signup event is set, with a Slipping tag.
  - A **This week** panel picks one page from the last 28 days, cached per week under `week:<Monday>` (`src/lib/search-console/action.ts`), with facts, fixed steps and a guide link.
  - **Show another** (a client part) and **Mark as done**: the server checks the page is this week's candidate, then adds a chart note with `search_page` and `search_query` (migration `0008`).
  - A follow-up shows how the last page did since (`search_followup`, per note).
- **Monday email:** What moved (up to 3 lines), the 30-day customer line, and This week on Google search.
- **Copy and docs:**
  - Plan features, the Pro teaser ("See what really brings your customers"), settings text and `llms.txt` updated.
  - Spec section 31, decisions, checklist, README, and the search console, revenue and email docs updated.
  - New docs pages `what-brings-customers` and `what-changed`, and a guide, `first-user-source-vs-session-source`. 17 existing pages updated, and 3 new screenshot slots added (31 in all).
- **Checked:**
  - `npm run check` passes (54 files, 429 tests).
  - The `/ui-kit/dashboard` previews (`state=pro`, `normal`, `no-history`, the new `search-done`) at 375 and 1440 px, with a keyboard pass (switch with arrows, rows open with Enter, visible focus).
  - `/ui-kit/email` as HTML and plain text.

### Learned

- **GA4 already credits a direct return visit to the earlier source.** Session and first-user scopes use "paid and organic channels last click". So "came from X, came back direct, bought" is already X in the old card. What was missing is the first source when the return visit came through another real channel, such as a Google search for the brand. Event-scoped attribution gives fractions, so we don't use it.
- A batched GA4 request fails as a whole, so new dimension combinations go in their own `loadReports` call.
- Nested CSS-radio switches can't use `data-option-index` selectors (the inner tabs have them too). The metric switches select on `[name=…][value=…]:checked` instead.
- Turbopack won't build through a symlinked `node_modules` outside the project, so the clean build copy uses an APFS clone (`cp -Rc`).

### Next

- Migration `0008` needs nothing on the server: the container applies new migrations when it starts. Siamak runs `npm run db:migrate` locally only. `scripts/migrate.mjs` now says what it did ("applied 1 new migration" or "nothing new"), checked on a throwaway Postgres going from 0007 to 0008.
- Siamak: do the 2-minute GA4 Explore check (First user source × Session source).
- After deploy: compare the First column's total with Signups on a real property, and try Mark as done.
- Siamak: the 3 new screenshots (`what-brings-customers-card`, `what-changed-card`, `search-this-week`).
- Ideas (not in the roadmap): a "found you" line on the public page (opt-in); a weekly-pick history list in Settings.

## 2026-10-16 · Session 14 · Docs, guides, glossary and comparisons

### Done

- **Fumadocs** (core and UI 16.15.17, MDX 15.4.5), in `src/app/(content)/` and `src/components/content/`:
  - One loader over `content/{docs,guides,glossary,compare}`, defined with the Macro API in `src/lib/content/collections.ts`.
  - Layout: the section tabs, a menu with short `menuTitle` labels, the page in the middle, "On this page" on the right, and Ctrl/⌘ K search. Light only, on our theme tokens (the `fd-*` colours are mapped in `globals.css`, and the theme test allows them).
  - Each page has its title, description, canonical address, a social image of its own (`/content-og/<page>/image.png`), Article and Breadcrumb JSON-LD, "Copy Markdown" and "Open in ChatGPT / Claude", "Edit on GitHub" and the last updated date.
- **For AI assistants:**
  - A Markdown copy of every page at its address plus `.md`, through rewrites to `/llms.mdx/…`.
  - `contentToMarkdown` (tested) writes prices and other code facts as their values and leaves screenshots out.
  - `/llms.txt` lists every page; `/llms-full.txt` has them all. Every page is in the sitemap.
- **Facts from the code:**
  - Components `Price`, `FreeDays`, `MonthsFree`, `PlanFeatures`, `Freshness`, `Scope`, `PlainWordsTable`, `SupportEmail` and `SourceRepo`.
  - The cache times moved to `src/lib/ga4/freshness.ts`, and the plain-words table to `src/config/plain-words.ts`.
- **Screenshots:** 28 `ImageSlot`s. Each renders nothing in production until `public/content/<id>.webp` exists, and a dashed box with the instructions in development. `npm run content:images` writes `docs/CONTENT-IMAGES.md`.
- **94 pages:** 23 docs, 46 guides, 14 glossary pages and 11 comparisons, following the plan's rules (answer first, headings as questions, sources linked, honest comparisons with no competitor prices typed).
- **Checked:**
  - All 50 outside links opened. Six source labels were updated to Google's and Stripe's current page titles.
  - Platform steps checked against the vendors' help pages. Three were wrong and are rewritten: Framer has a Measurement ID field, Carrd moved Google Analytics under Manage → Analytics, and Webflow's tab is now "Integrations".
  - Stripe's key creation is now Create secret key → custom permissions → two-factor. The guide, the revenue docs and the app's own settings text are updated.
- **Links in:** the landing header (Guides, Docs) and footer (all four sections), and the app's help links for "no GA4 site", "no key events" and "no purchase values" now go to our guides.
- **Tests:** `src/lib/content/content.test.ts` checks frontmatter (description 70 to 160 characters, titles or `seoTitle` up to 60), links and `#anchors`, menus, no typed prices or section signs, and the screenshot list. Also tests for `contentToMarkdown`, the freshness times, structured data and `llms.txt`.

- **Final checks:**
  - The production build was run exactly as Docker does: no `.env`, only `APP_URL`. Earlier scratch builds had a stray `.env` copy, so they weren't truly empty; that is fixed now.
  - The content root is named "SimpleDash", so search shows "SimpleDash › Docs › Help".
  - Markdown copies drop the indentation Prettier adds inside components (it read as code blocks) and use absolute links.
  - A test now fails on unquoted `: ` in frontmatter, which breaks the YAML (the build caught one first).

### Learned

- The Macro API evaluates the whole module that defines a collection, so keep `defineDocs` alone in its module.
- The production server checks every secret at startup, so a local `next start` needs dummy values. The build itself needs only `APP_URL`.
- Next.js allows no `opengraph-image` under a catch-all route; a static route handler works instead.
- Typed routes don't accept an optional catch-all's bare address (`/docs`), so those links are cast.
- Fumadocs adds about 80 KB of gzipped JavaScript to content pages compared with the landing page. It loads after the static HTML, with no layout shift.

### Not checked

- Lighthouse (not installed here): run it on `/docs` and a guide after deploy.
- The GA4 menus in the guides were written from Google's current help pages, not clicked through on a real property.

### Next (Siamak)

- Add the screenshots in `docs/CONTENT-IMAGES.md`.
- Cloudflare AI bot policies, the Search Console sitemap, Bing Webmaster Tools and Crawler Hints (CHECKLIST).
- After deploy, share one guide a week on X (the plan's distribution section).

## 2026-10-15 · Session 13 · One-click site menu and settings pages

### Done

- **Pointer cursor** on every link, button, menu item, checkbox, radio and select: one base rule in `globals.css` (Tailwind 4 resets buttons to the default cursor), and `cursor-pointer` in `ui/dropdown-menu.tsx` (shadcn had `cursor-default`). Disabled controls keep the default cursor.
- **One site menu for Free and Pro** (`SiteSwitcher`):
  - It lists every Google Analytics site in the Google account (live, kept in the browser for 5 minutes, fetched on hover), grouped by account, with search from 8 sites.
  - One click opens a site, with no dialog and no Switch button. Own sites are plain links. Any other site goes through `openSite`: Free swaps it in (`switchProperty`), Pro adds it (`addProperty`, up to 10, with a clear message when full). Both check Google's list on the server.
  - The rows come from `siteMenuGroups` / `filterSiteMenu` (`src/lib/sites/menu.ts`, 6 tests).
  - A gear next to each of the user's sites opens `/settings/sites/<id>`.
- **Removed:**
  - "Add a site", "Switch site", "All sites", `SitePickerDialog` and the `/sites` page (`SitesView`, `SiteCard`, `AddSiteCard`, `Sparkline`, `lib/sites/summary.ts`) and its ui-kit preview.
  - `switchSite`, `addSite`, `canAddSite`, `SettingsView`, `SiteLinksMenu`.
- **Settings pages:**
  - `/settings` (Profile), `/settings/billing`, `/settings/email` and `/settings/sites/[siteId]`, in `SettingsShell` with `SettingsNav` on the left ("Account", then "Sites"; a row that scrolls sideways on phones).
  - The sections are in `settings-sections.tsx`, and the addresses in `settings-routes.ts`. The menu's items come from `settingsNavGroups` (4 tests).
  - Every link that went to `/settings#…` or `?site=` now uses the new addresses: the email, Stripe's cancel and return URLs, Search Console's return, the dashboard and the actions.
  - Old addresses still land on the right page: `?site=` is redirected on the server, `#billing` / `#email` in the browser.
- **Polish found while checking:**
  - Keyboard focus fell out of the site menu when Google's list arrived and rebuilt the rows. It is now put back on the same row.
  - The phone settings row cut off the focus ring.
  - Scrolling the settings row to the page shown could move the page itself. Now only the row scrolls.
  - "Paused" no longer squeezes the site's name.
- **Checked:**
  - `npm run check`: 47 files, 381 tests, lint clean.
  - A production build with an empty environment.
  - The `/ui-kit` dashboard and settings previews at 375 and 1440 px, with a keyboard-only pass: open the menu, arrow keys, Enter on a site, the gear, Escape back to the chip, Tab through the settings menu.
  - Computed cursors are "pointer".
- **Docs:** SPEC (the update note, and sections 5, 7, 16 and 28.1), README pages, `docs/ui.md`, `ga4.md`, `billing.md`, `email.md`, `public-page.md`, CHECKLIST, DECISIONS, CLAUDE.md (settings addresses come from one file).

### Later the same session: no site limit

- **Siamak's call:** Free and Pro both open every Google Analytics site in the account, and the menu is the same on both.
- **Removed:**
  - The `sites` limit in `plans.ts` and `entitlements`.
  - `openableSites` (the Monday email and public pages now use the whole list), the `"upgrade"` choice in `chooseSite` (it now returns the site or null), and `SiteContext.openable` and `choice` (now `site`).
  - The replace mode, `SiteLimitError` and `switchProperty` in `properties.ts`. `addProperty` now takes no limit.
  - The paused-site dashboard (`paused-site.tsx`), `PausedSiteSettings`, `openListedSiteAction`, the "Several sites are part of Pro" panel and its `children` slot, "n of 10 in use", the Free footer in the menu, "Paused" in the settings menu, and the `openable` field in the menu's rows.
- **Sitemap:** public pages now come from one query (on, indexable, site listed and working).
- **Copy:**
  - Free is "All your Google Analytics sites"; Pro's "Up to 10 sites" is gone.
  - Updated: hero, FAQ, terms (also "Settings → Plan & billing"), `llms.txt` (with a test), CLAUDE.md, README, SPEC (sections 5, 7, 15, 16, 17 and 28.1), billing, ga4, email, public-page and ui docs, CHECKLIST, DECISIONS.
- **Keyboard fix:** when Google's list arrives, focus now goes back to the exact item it was on (the site or its gear), not just the row.
- **Checked:**
  - `npm run check`: 47 files, 376 tests, lint clean.
  - On the previews: the Pro menu without a count, the Free menu at 375 px with the keyboard only, Free with three sites in settings, and the landing page's pricing text.
- **For Siamak:** `docs/ROADMAP.md` still says one site on Free and 10 on Pro. No migration this time either.

### End of the session: ranges include today

- **Siamak's call:** Last 7 days, Last 30 days and Last 12 months end today, so far, on the dashboard and public pages (Plausible and DataFast do the same). Yesterday is unchanged; Today alone still isn't compared.
- **`rangeWindow`:** 7 and 30 days end today, and 12 months is 11 full months plus this month. All are `endsToday`, so `comparisonGap` now only blocks single-day ranges that end today. Multi-day ranges are compared, so the change runs a little low until the day ends.
- **No fake zero:** a daily or monthly series leaves today off until Google has a row for it (`parseReport`), like hourly charts already did.
- **Free's 30 days:** `freeFirstDay` is today minus 29, the first day of Last 30 days.
- **Monday email:** it used `"7d"` as "last week", which would now include Monday. It now uses `lastWeekRange` (last Monday to Sunday, as a custom range), and so does the `/ui-kit/email` preview. The `email_send` week key is unchanged.
- **Cache:** reports for ranges that end today stay fresh for 30 minutes (1 hour on public pages), so 7 and 30 days refresh more often than before (it was 3 hours, or 12 hours on public pages). `warm-cache` still runs hourly for sites opened in the last 24 hours. The GA4 Data API has no per-call cost.
- **Copy:** the visitors chart's help text, CLAUDE.md (the Dates rule), SPEC (sections 1, 8, 10, 16 and the facts table), ga4, email, CHECKLIST, DECISIONS.
- **Checked:** 379 tests (the date fixtures moved by a day, plus new ones for `lastWeekRange` and today being left off). The real dashboard needs a signed-in check.

### Content plan

- **`docs/CONTENT-PLAN.md`** (a proposal; docs and guides aren't in the roadmap yet). It covers:
  - who we write for, and the one definition used everywhere
  - how a topic earns a page (fit, demand, win chance)
  - five site sections: `/guides`, `/glossary`, `/docs`, `/compare` and `/changelog`
  - eight clusters with about 95 pages in four phases, and the first ten pages
  - page templates, AI assistants and agents, distribution, measurement with a monthly prompt check, and how it would be built
- **Checked on official pages today:**
  - Google: no special files or markup are needed for AI Overviews and AI Mode, and crawling must be allowed by the CDN too.
  - Google: FAQ rich results stopped in May 2026, and `llms.txt` neither helps nor hurts in Google Search.
  - Google's generative AI content guidance was updated on Oct 1, 2026.
  - Cloudflare: its AI bot policies have Search, Agent and Training categories, with new defaults since Sept 15, 2026.
  - WebSearch wasn't available, so these were read in the browser.
- **The launch kit had outdated claims,** now fixed: "14 days free", "free for one site", Pro "for more sites", "yesterday is marked still updating". The Product Hunt description is within 260 characters again (256).
- **README's docs table** lists the plan, and the billing row no longer says "Trial".

### Not checked

- The live Google list and opening a real site, signed in. The preview's open button returns a fixed message. It needs a real account, locally or in production.

### Next (Siamak)

- Try the menu signed in on Free and on Pro: open a site that isn't yours yet, then use the gear.
- No migration this time.

## 2026-10-14 · Session 12 · Our own Google Analytics, with consent

### Done

- **Consent banner and GA4:** `ConsentBanner` (`src/components/shared/consent.tsx`) sits in the root layout, so it covers every page. "This website uses cookies", with Decline and Accept the same size (Accept in the brand colour).
  - Google's script loads only after "Allow". Ads features are off.
  - The choice is saved with its date and asked again after 13 months (Accept) or 6 months (Decline).
  - "Cookie settings" is in the footer and on the privacy page. Taking back an Allow deletes the `_ga` cookies and reloads.
  - Off inside frames (the demo) and on `/email/*`.
  - Google loads only on the live host.
- **The ID:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` goes in app.env. setup.sh copies it to the GitHub variable `GA_MEASUREMENT_ID`, and the workflow passes it to the Docker build as an argument.
- **Privacy page:** a new "How we count visits" section (what, cookies, purpose, Google in the US under the Data Privacy Framework), Google in the processors, the cookies section rewritten, and a line on public page visitors.
- **Checked in the browser:** Allow, then reload; a recent "No thanks"; 200- and 300-day-old choices; Cookie settings; no banner inside the demo frame; 375 px.

### Next (Siamak)

- Run `deploy/setup.sh` (it sets the GitHub variable), then push: the banner goes live with that deploy.
- In GA4 admin: data retention at 14 months, Google signals off.

## 2026-10-14 · Session 11 · First deploy: simpledash.app is live

### Done

- First real run of `deploy/setup.sh` on the Azure VM. Bugs found on the way, all fixed:
  - **The certificate went to `/opt/proxy/certs/Ubuntu/`.** `. /etc/os-release` overwrote the script's `NAME`, so Caddy crash-looped (seen as "No such exec instance"). The file is now read in a subshell, and the stray folder is removed.
  - **Reloading the proxy:** the config is now checked first in a one-off Caddy container (Caddy's own error is shown), then a reload with retries, then a restart as the fallback.
  - **Certificate prompts:** each file must have its own PEM header, so a certificate pasted as the key is refused and asked again.
  - **Restore:** rclone's notice was read as a backup file name. Now only real backup names count, rclone logs errors only, and it fails within about a minute.
  - **`R2_ACCOUNT_ID`:** a pasted full endpoint is cut down to the ID, and a half-filled R2 set stops setup.
  - **`setup.sh -i <key>`** added, like `ssh -i`.
  - **GitHub couldn't reach port 22**, because the Azure rule allowed only Siamak's IP. Siamak chose SSH from Any, with keys only (password login off) and fail2ban (5 tries, 1 hour ban).
  - **A failed deploy no longer prints the app's log into the public Actions log.**
- The deploy from `main` went green, and https://simpledash.app is live (Stripe in test mode).

### Next (Siamak)

- Run `deploy/setup.sh -i … azureuser@…` once more to apply keys-only and fail2ban (the push deploy doesn't), then `sudo reboot` for the pending updates.
- `sudo simpledash backup`, and check that a file appears in R2.
- Google OAuth redirect URI for simpledash.app, Resend domain, Sentry DSN, the Search Console API.
- Live Stripe at launch; the Azure region for the privacy page; Lighthouse on the real domain.

## 2026-10-14 · Session 10 · Free and Pro, no trial, and open source

### Done

- **Siamak's call:** Free (one site, the last 30 days, a public page with "Powered by SimpleDash") plus one paid plan, Pro ($9 a month or $90 a year, tax included, everything, launch price kept while subscribed). No trial. Open source under AGPL-3.0, with the internal docs kept public.
- **Plans:**
  - `plans.ts` holds Free and Pro, with `limits`: `sites`, `fullHistory`, `weeklyEmail`, `searchConsole`, `revenue`, `poweredBy`. Prices are in USD (`formatPrice` with a narrow "$").
  - `planState` is now paid or free, and nothing locks. `LockedPanel`, the 402s in CSV and live data, and the jobs' "unlocked" filter are gone.
  - The webhook treats any paid subscription as Pro: an unknown price is reported, but stays Pro.
  - Checkout has no trial and takes only `interval`; a paying user gets the Portal. `createPlanChange` is removed.
- **Free's 30 days:**
  - `rangeForPlan`, `fitsFreeHistory` and `freeFirstDay` live in `ranges.ts`.
  - On Free, the date menu shows "Last 12 months" with a Pro badge that opens Settings → Billing (by click or the L key), the calendar starts 30 days back, and a note sits under the menu.
  - An older `?range=` shows Last 30 days, with `HistoryNotice`. The same rule applies to CSV and to a Free owner's public page, which drops 12 months from its menu.
- **Pro only:**
  - The Monday email: the job reads `paidUserIds()`, and Settings says it's part of Pro.
  - The "part of Pro" panels (`UpgradePanel`: sites, search, revenue, email) with one `UpgradeForm`.
- **Public pages:** "Powered by" shows on Free only; the demo always has it and every range (`getPublicView(..., demo)`).
- **Everywhere on screen:** Starter and Growth became Free and Pro: pricing section ("$0 / month" and "$9", launch price note), hero, how it works, FAQ ("Is it really free?", "Is SimpleDash open source?"), terms (Free may change with 30 days' notice, the launch price), privacy (a link to `schema.ts`), `llms.txt`, structured data, `/admin` counts, and the dev previews (`?state=pro`, `free-menu`, `free-history`; public `?state=free`).
- **Migration `0007_pro_plan.sql`:** paid rows become `pro`, and `trial_ends_at` is dropped. Tested on a local Postgres with trial, Starter, Growth and cancelled rows.
- **Stripe test mode:** "SimpleDash Pro" (`prod_VRKUUhARi1JbiX`) with tax-inclusive $9 and $90 USD prices. Both Checkout sessions with Managed Payments opened at the right amounts and were expired again. Local `.env` now holds the Pro price IDs; the GROWTH variables are gone.
- **Open source:**
  - README for outsiders: what it is, the plans, a "What SimpleDash stores" table, self-hosting "works but isn't supported", contributing, license.
  - New files: NOTICE (trademark, GeoNames, flags, icons, fonts), CONTRIBUTING (AGPL in, AGPL out), SECURITY.
  - The server IP and the "password shared in chat" notes are removed from the docs.
  - `brand.sourceUrl` points to the GitHub repo.
- **A bug from before, fixed:**
  - `getSession` read `auth.api` (and so `BETTER_AUTH_SECRET`) before `await headers()`. A build without env vars, like the Docker image on GitHub, crashed while prerendering `/settings`.
  - Earlier builds passed only because `.env` was there. `headers()` now comes first.

- **Several sites on one server (later the same day):**
  - HTTPS moved out of SimpleDash's compose into one shared proxy in `/opt/proxy` (`deploy/proxy`), with SimpleDash's block in `sites/simpledash.caddy` for its own domains only. A block the proxy rejects is put back.
  - The `deploy` user became `simpledash`.
  - The app is `simpledash-app` on the shared `web` network.
  - The certificate moved to `/opt/proxy/certs/simpledash/`.
  - The proxy and network are created only if missing.
  - `deploy/setup.sh` now asks for missing values (one run), installs and signs in `gh`, adds new `.env.example` variables, checks formats like `env.ts`, and makes empty secrets.

### Checked

- `npm run check`: 45 files, 372 tests. New and rewritten tests cover plans, prices, the webhook, Free's 30 days (including the site's time zone and both menus), `llms.txt` and structured data.
- `next build` with an empty environment (`env -i`, only `APP_URL`) passes; the landing, privacy and terms pages are still static.
- In the browser, on a repo copy on :3200 against a throwaway Postgres:
  - pricing at 1440 and 375 px, Monthly and Yearly
  - the Free date menu with the Pro badge and its keyboard path (L opens Settings → Billing)
  - the 30-day note
  - Settings on Free and Pro
  - the paused site
  - the public page on Free (no 12 months, "Powered by") and on Pro (no link)

### Not done

- **`LICENSE`:** the official AGPL-3.0 text isn't in the repo yet. Fetching it from gnu.org is a download, so it waits for Siamak's OK. GitHub's "Add file → LICENSE" template is the other way.
- Lighthouse wasn't run.

### Next

- Siamak:
  - `npm run db:migrate` (0004–0007).
  - The live Pro product and prices.
  - The Portal with Pro's two prices.
  - Update `ROADMAP.md` (pricing; the subheadline now says "the history GA4 already has").
  - Decide on contributor terms.
  - Make the repo public before the site goes live (the FAQ and privacy page link to it).
  - Tell Claude the Azure region for the privacy page.

## 2026-10-14 · Session 9 · Hosting: one server, one command, deploys from GitHub

### Done

- **Siamak's call:** no Coolify and no Supabase in production. One server (Azure today) with Docker Compose; set up with one command; every merge to `main` deploys; moving to a new server is the same command with `--from`. Everything free beyond the server.
- **`deploy/compose.yaml`:** the app (`simpledash-app:current`, never pulled), Postgres 17, Caddy (Cloudflare Origin Certificate, Full (strict), `www` and HTTP redirects, `/api/internal/*` refused) and the backup helper. `DATABASE_URL` and `BACKUP_DATABASE_URL` are built from `POSTGRES_PASSWORD`.
- **`deploy/setup.sh user@server [--from user@old]`** (on the Mac):
  - The first run builds `deploy/secrets/app.env` from `.env.example` (new random secrets, service keys from `.env`, `STRIPE_WEBHOOK_SECRET` left empty on purpose) plus the deploy key, and stops until everything is filled in.
  - Then it sends the files over one SSH connection and runs `simpledash setup` as root: apt upgrade, automatic security updates, UTC, swap, Docker from Docker's repo, `ufw`, the `deploy` user with a key that can only run `simpledash deploy`. It starts db, caddy and backup.
  - With `--from`: it stops the old app and backs it up first.
  - It restores the newest R2 backup into an empty database, sets the GitHub secrets and the `DEPLOY_PLATFORM` variable with `gh`, runs the first deploy and watches it, checks port 443, and sets the Cloudflare DNS when a token is given.
- **`deploy/simpledash`** on the server: `status`, `logs [jobs]`, `job`, `backup`, `restore [--force]`, `stop`, `start`, plus `setup` and `deploy`.
  - `deploy` reads the release from stdin, keeps the previous image, waits for `/api/health` and goes back if the new one isn't healthy.
  - Folders are updated file by file, because Caddy's mounted `caddy/` folder would keep pointing at a removed folder.
- **`.github/workflows/deploy.yml`:** check on every PR and push. On `main`, once a server is set up, it builds with the GHA cache and streams `docker save` plus the release files over SSH. No registry.
- **Jobs** moved from Coolify's scheduled tasks to `deploy/crontab` (the deploy user's crontab, UTC, output in the journal). That also covers the `revenue-sync` task Siamak still had to add.
- **`scripts/backup/restore.sh`** (with `r2.sh` shared with `backup.sh`): plain, `--if-empty` and `--force`.
- **Docs:** `deploy.md` rewritten, plus `backup.md`, SPEC sections 2, 3, 4, 17, 20, 21, 22, 24 and 25, DECISIONS (old Coolify and Supabase lines struck through), CHECKLIST (new "Hosting" section), README, CLAUDE.md, `.env.example`, `ga4.md`, `revenue.md` and `launch.md`.
- **Privacy page:** the processors are now Microsoft Azure (server and database) and Cloudflare (with backups). `legal.lastUpdated` is 2026-10-14.

### Checked

- `npm run check` passes in a clean copy of the repo without `.env` (what GitHub's runner sees): 45 files, 368 tests.
- `setup.sh` on a copy of the repo:
  - The first run creates the secrets and lists what's missing.
  - The second run gets as far as SSH, with a clear message when the server can't be reached.
  - Unknown options are refused.
- `restore.sh` on the throwaway local Postgres, with rclone replaced by a local folder: all six cases, and the newest of two files wins.
- `install_release_files` against a fake `/opt/simpledash`: the files are copied, the scripts are executable, and the caddy folder keeps its inode.
- YAML of the workflow and the compose file parses.

### Not checked (needs a real server or GitHub)

- `simpledash setup` and `simpledash deploy` on a server, Caddy with the real certificate, and the workflow's first run. There's no Docker or Linux VM on this Mac.
- The first real run is the test. Siamak's steps are in CHECKLIST → "Hosting".

### Learned

- Google's console lists `webmasters.readonly` as **non-sensitive**. Only `analytics.readonly` is sensitive.
  - `docs/google-verification.md` line 23 still calls Search Console sensitive.
  - Claude offered to fix it; it waits for Siamak's OK.
- Docker-published ports bypass `ufw`. That's fine here: only Caddy publishes 80 and 443, and the app and Postgres publish nothing.
- macOS ships bash 3.2, so `setup.sh` avoids newer bash features (no associative arrays, no `mapfile`).

### Next

- Siamak: the certificate, R2, Azure ports 80 and 443, push, then `deploy/setup.sh azureuser@<server-ip>` twice.
- Tell Claude the Azure region for the privacy page.
- After the first deploy: Lighthouse on the real domain, and the three V2 "Done when" checks.

## 2026-10-13 · Session 8 · V2 built: Growth, several sites, Google search insights, revenue

### Done

- **Sprint 5, Growth and several sites.** Growth on sale in `plans.ts` with `limits`; one function decides what a plan allows (`entitlements`). Stripe test product "SimpleDash Growth" with €19 / €190 (made with Siamak's OK); `billing.plan` from the price in the webhook (an unknown price never unlocks Growth); Checkout with `plan`; paying customers change plan through the Portal's confirm flow. Plan choice (`UpgradeForm` over the shared `PlanCard`), the "Upgrade to Growth" panel, the locked panel with both plans. Sites: `site.added_at` (in the list) next to `is_active` (opened last), `siteAccess` rules (tested), `requireSite(siteId)` everywhere a site is used, `?site=` on the dashboard, CSV and live. The site menu and the site picker dialog (live GA4 list, grouped by account, search); `/sites` with a card per site; Settings → Sites (remove); one public page per site; the Monday email with a block per site; `warm-cache` only for sites opened in 24 hours. Going back to Starter keeps everything, paused.
- **Sprint 6, Google search insights.** Search Console connected per site with Better Auth's link flow (`webmasters.readonly` asked only then), the property picked by domain (parent domain properties get a page filter), five views worked out from Search Console's rows at fetch time: close to page 1 (grouped by page), what changed (pages up and down with the searches behind each, clicks and position then and now), your name vs others (stacked bars, Google's own regex filters), seen but not clicked (compared with the site's own pages at the same position), and Google clicks next to GA4 visitors and signups per landing page. Honest notes: its own dates, 2–3 days behind, 16 months, hidden rare searches. Settings card (connect, property, name spellings, disconnect).
- **Sprint 7, revenue and sales.** A pasted restricted Stripe key (refuses `sk_`/`pk_`, four reads name the missing permission, encrypted, last 4 shown), daily totals per currency (charged, refunded, new customers, MRR snapshots), 25-month backfill and the hourly `revenue-sync` job. Revenue and New customers in the overview ("1 per 412 visitors", MRR), revenue bars under the visitors line. "What counts as a sale?" (key event or thank-you page) and the Sales and signups by source card (GA4 counts; revenue only from GA4's `purchaseRevenue`). The payment-page warning in Sources (dashboard only).
- **Also:** "Allow access" now uses the link flow (a plain sign-in never updated the stored scope, so that state could loop). Privacy policy and terms cover Growth, Search Console and Stripe (`legal.lastUpdated` 13 Oct). A stale credit line fixed (flags are country-flag-icons). `llms.txt`, structured data (Growth offers), README, SPEC (sections 9, 16, 17, 20, 22, 28), DECISIONS, `docs/search-console.md`, `docs/revenue.md`, `docs/auth.md`, `docs/billing.md`, `docs/public-page.md`, `docs/email.md`, `docs/ga4.md`, `docs/ui.md`, `docs/google-verification.md` (the new scope's justification).
- Migrations `0004`, `0005`, `0006`, tested on a throwaway local Postgres 17 with old rows (backfills included). **Not run on Supabase**: Siamak runs `npm run db:migrate`.
- 368 tests pass (87 new); typecheck and lint are clean; the production build passes and the landing page is still static.

### How it was checked

- A throwaway local Postgres (`initdb` in the scratchpad, port 54329), seeded with a Growth test account, three sites and cached sample reports; the dev server ran from a synced copy of the repo (Siamak's own dev server was on :3000 in the repo, and Next won't start a second one there) on :3200 with `DATABASE_URL` pointing at the local database, signed in with a seeded session cookie. Checked: the site menu, switching, "last opened", All sites, the picker, Settings → Sites and the public page per site, Starter after Growth (paused sites, "Show … instead"), Growth Checkout in Stripe's sandbox (it keeps the trial days).
- Headless Chrome screenshots through a small DevTools script (the browser pane was hidden) for every tab of the Google search card, the revenue overview, the sales card and the Settings cards, at 1280 and 375 px.
- Once against real systems, with Google faked where a sign-in is needed: the Search Console data layer (12 calls, then all from cache), add / limit / replace / remove sites (the advisory lock, `coalesce` on re-adding), and the Stripe reads plus the sync against Siamak's Stripe test account (no charges there yet, so the totals were zero; the sums have unit tests).

### Problems found

- Better Auth never updates `account.scope` on sign-in, only through `linkSocial`: the V1 "Allow access" button couldn't have worked. Fixed with the link flow.
- An exported "link any scope" server action would have let the browser ask Google for any scope. The helper is server-only with a fixed list.
- I ran `git mv` once and it staged a rename; I restored the index straight away (`git restore --staged`). Nothing else touched git.

### Learned

- Turbopack refuses a symlinked `node_modules` outside the project; an APFS clone (`cp -cR`) works and costs no space.
- Headless Chrome screenshots freeze CSS entry animations at their first frame: `--force-prefers-reduced-motion` shows the real page (our CSS turns motion off then).
- `vi.mock` only hoists for a literal `vitest` import, so one-off integration checks live in the git-ignored `.vitest/` folder, run with their own config, then get deleted.
- Search Console: query-filtered totals drop anonymized searches, so "your name" + "others" < all clicks; the API sorts by clicks only, so impressions-heavy views need the full 25,000 rows.

### Next (Siamak's part, see the checklist)

1. `npm run db:migrate` (0004–0006). Then sign in on localhost: the dashboard, `/sites`, Settings.
2. Stripe: Customer Portal "switch plans" with all four prices (test and live); the live Growth product and prices.
3. Google Cloud: turn on the **Search Console API**; add `webmasters.readonly` to the consent screen and the verification request.
4. Coolify: the `revenue-sync` scheduled task.
5. The three "Done when" checks for Sprints 5–7.

### Ideas (outside the roadmap, not built)

- "What changed" could also list a rising page's searches that fell (they're in the data; only same-direction ones are shown now).
- A CSV of daily revenue from the overview's CSV menu.
- Lighthouse wasn't run (not installed here); run it on the landing page, `/demo` and a public page after deploy (only the pricing card changed on public pages).

## 2026-10-13 · Session 7 · V2 planned

### Done

- No code changed. Brainstormed features with Siamak, compared them with the roadmap's V2, and wrote the agreed plan: `docs/SPEC.md` section 28 (V2) and section 29 (V3), the V2 and V3 lists in `docs/CHECKLIST.md`, and six lines in `docs/DECISIONS.md`.
- **V2 = the Growth plan:** Sprint 5 Growth plan and several sites (with `warm-cache` refreshing only opened sites first), Sprint 6 Google search insights (Search Console, five views), Sprint 7 revenue from Stripe (read-only, daily totals) and sales by source from GA4.
- **The rule for V2:** exact numbers only. Dropped for good: the checkout snippet, the Measurement Protocol (it writes into the user's GA4), and estimated revenue per source or per search.
- `docs/ROADMAP.md` is Siamak's brief and wasn't edited; section 28 says it replaces the roadmap's V2 list.

- Siamak answered the open questions (section 28.4): Growth allows 10 sites, the trial is Starter only, and the Stripe connection is a pasted restricted read-only key.

### Next

- Sprint 5, when Siamak says go.
- Start Google's verification for `webmasters.readonly` early (Sprint 6 depends on it).

## 2026-10-12 · Session 6 · Custom date ranges; DataFast-style list cards

### Done

- **List cards** (`ListCard`): no visible title, ⓘ or CSV button. Tabs at the top left (one view shows as a single tab), the view's column names at the right (they wrap under the tabs on narrow cards), the top 10 rows at a fixed height, and "Details" at the bottom.
- **Details** (`ListDetails`, shadcn `dialog`): the full list of the active view with search (accents and case ignored), zebra rows, a sticky header, the card's help, a row count, and a CSV of the rows shown, built in the browser (`listCsv`). Fixed height for long lists so searching doesn't make it jump; no keyboard pop-up on phones; focus returns to the button.
- **Devices:** Browser | OS | Device, with logos (`TechIcon`, `public/icons/tech` from `scripts/copy-tech-icons.mjs`). **Countries:** Country | City. Three new reports: `browsers`, `systems`, `cities`.
- **Summary line** taken off the pages (still in the email) and out of the public card picker; the period text is smaller and lighter. "Right now" hides its title but keeps the ⓘ (GeoNames credit).
- 281 tests pass; typecheck and lint are clean. Checked at 1440 and 375 px.

### Problem found

- **meetline.me's site is marked `needs_reconnect`** (read-only check of the database), so `/p/meetline-me` shows "paused" and the demo falls back to sample data. It happened after the custom-range test that still used live data. Only a failed Google token refresh (`invalid_grant`), an undecryptable token or a 401 sets it; a rejected request (400) doesn't. Siamak reconnected it on 13 Oct and it's `ok` again. If the Google OAuth app is in "Testing", its refresh tokens expire after 7 days: worth publishing it before launch.
- After reconnecting, `/p/meetline-me` loads live data with the new `cities` report. Cities Google couldn't place are now one "Unknown" row (they showed once per country). `browsers` and `systems` weren't tried live: meetline's public page doesn't show Devices, and the browser pane isn't signed in to the dashboard.

- **Custom ranges** in the URL: `?range=2026-09-01..2026-09-30`. `parseRange` checks real days, puts them in order and starts no earlier than GA4's first day (14 Aug 2015); `rangeWindow` cuts them at today in the site's time zone and at 5 years. Compared with the same number of days just before. Hourly for one day, daily up to 92 days, monthly after. A range that ends today isn't compared; a finished one is cached for 24 hours. Summary: "145 visitors from 1 Oct 2025 to 28 Feb 2026", "Visitors up 4% vs the 30 days before".
- **The date menu** (`RangePicker`): keys like DataFast's (T, Y, W, M, L, C), active only while the menu is open and hidden on touch screens; "Custom…" opens `CustomRangePanel` under the button: shadcn `calendar` (react-day-picker 9.14.0) with two months (one on phones), hover preview, future days greyed, Start/End date fields in step with it, Clear and Apply. It loads in its own chunk when Custom is first pointed at.
- **Public pages:** custom ranges work there too, capped at 20 new ranges per site per hour (`allowPublicCustomRange`), because anyone can type one and each costs the owner's quota. Past the cap: cached numbers and a notice.
- `rangeLabel`, `previousPeriodWords`, `isPreset`, `customDays` replace the per-preset maps; `rangeMenu` returns everything the menu needs. `maxAge` now takes the window.
- Checked at 1440 and 375 px (the panel stays on screen and scrolls inside on short phones), keyboard (open the menu, press C), Apply navigating to the new address, a real custom range on `/p/meetline-me` with live GA4 numbers, and a production build (landing still static). 276 tests pass; typecheck and lint are clean.

### Learned

- shadcn's `calendar.tsx` defines its day buttons inline, so every render remounts all 42 of them. With a hover preview, a click that lands mid-render is lost. Stable components fix it (noted in `docs/ui.md`).
- Opening a Radix popover from a dropdown item: open it in the menu's `onCloseAutoFocus` (and prevent the default), or the menu's focus handling closes it again straight away.
- The shadcn CLI pauses on "overwrite button.tsx?"; `yes n | npx shadcn add calendar` answers it. It also installs `cn` and `date-fns`, which aren't needed.

### Ideas (outside the roadmap)

- DataFast's ‹ › arrows next to the date menu, to step to the period before or after.
- "More periods" (this month, last month, this year) if people ask.

## 2026-10-12 · Session 5 · UI polish: live demo, overview, ranges, pricing; sharper flags

### Done

- **Live demo:** `/demo` shows the public page set in `src/config/demo.ts` (`meetline-me`, opening on Last 12 months because that site has no recent visits), or sample data when that page is off. The landing page frames it (`?embed=1`) in a browser window (`DemoFrame`: three dots, the address, fixed height, a handwritten "Interactive demo" note), loaded only when near the screen. `/demo` may be framed by our own site only. The old sample-data demo (`DemoDashboard`, `DemoSwitch`) is gone.
- **Today and Yesterday:** two new ranges with hourly charts (`dateHour`). Today is never compared ("Today isn't over yet") and leaves off the hours Google hasn't reported, so no fake zeros. Cache: Today is fresh for 30 minutes.
- **Overview:** `OverviewToolbar` (site chip, `RangePicker` dropdown, period and hint) and `OverviewCard` (the numbers in one row with short dividers, two by two on phones, and the chart underneath, with one CSV menu). Shared by the dashboard, public pages and the demo. `StatCard`, `VisitorsCard`, `StatValue` and `SegmentedLinks` are gone; the top bar is now just the logo and Settings.
- **Chart:** a smooth monotone curve (`smoothPath`, tested) in a lighter blue (`chart-1` #2F94E4, still 3:1 on the card) over a fading fill, drawing in from the left. The server-rendered chart got CSS-only hover tooltips with a guide line and dot.
- **Lists:** fixed height of 10 rows, "Show more" scrolls inside, soft blue bars that grow in, empty states keep the same height.
- **Signed in:** the landing page shows "Dashboard" and "Open my dashboard" from a `sd_signed_in` hint cookie (set by the proxy, read by a `<head>` script before paint). The page stays static.
- **Switches:** the segmented pill slides (CSS only); tab views fade in; small popovers fade and drop in.
- **Pricing:** Monthly | Yearly with a handwritten "2 months free" arrow, odometer-style rolling prices (CSS only), "Save €18 a year" / "Save €38 a year", Growth at €190 a year, "€0 due today".
- Checked at 375 and 1440 px, keyboard on the date menu, production build (landing still static, CLS 0, no console errors), `/demo` framing headers. 267 tests pass; typecheck and lint are clean.

- **Flags:** `public/flags` now holds 257 3:2 SVGs from country-flag-icons 1.6.20 (about 170 KB in total), copied by `scripts/copy-flags.mjs`. flag-icons and the PNGs are gone. `Flag` shows them at 16 × 10.7 px in the same 16 px slot. Codes lost against flag-icons: CP, DG, PC, UN, XX, none of which GA4 sends.
- **Site icons:** `fetchSiteIcon` tries DuckDuckGo, then Google's favicon service (`t2.gstatic.com/faviconV2` with `fallback_opts`, which answers 404 on a miss), then the generic globe. Still server-side, so visitors never contact either service. 4 new tests.
- Checked on `/ui-kit`: flags and icons load. 243 tests pass; typecheck and lint are clean.

### Not done

- Lighthouse wasn't run: it isn't installed here, and fetching it means downloading a package. Run it on the landing page, `/demo` and a public page after deploy.
- Cloudflare: add `/demo` to the cache rule (`docs/deploy.md`).

### Learned

- Tailwind v4's `translate-*` utilities use the CSS `translate` property, and `transition-transform` covers it, so CSS-only slides work with plain classes.
- A raw `<script>` in the root layout makes React warn on client renders; `next/script` with `beforeInteractive` puts the same inline script in `<head>` without the warning.
- With Cache Components, a default parameter `now = new Date()` counts as reading the time even when it's not used; compute it only where needed, after `connection()`.

### Ideas (outside the roadmap)

- A "Right now" number in the overview row, like DataFast's "Online", reusing the live data.
- Comparing Today with yesterday up to the same hour (needs an hour filter on both periods).

### Open questions from this session (for Siamak)

- **`warm-cache` cost:** every site whose owner signed in within 14 days is refreshed about every 3 hours, used or not (about 40,000 GA4 report calls a day at 1,000 active sites). Idea: only refresh sites whose dashboard was opened in the last day.
- **Google access lapsing:** unused refresh tokens can expire, which silently stops the email and public page. Idea: tell the owner by email when access ends.
- A public page whose owner is away more than 14 days refreshes only when someone visits it.

## 2026-10-12 · Session 4 · Sprint 4 built: V1 is complete in code

### Done

- **Billing:** the trial row for every new user, plan states (paid, trial, locked), the locked overlay with Monthly / Yearly and "Upgrade", Checkout with Managed Payments and `trial_end`, the Customer Portal, and the webhook (newest state wins, repeats skipped). Locked accounts read only cached numbers: no Google calls, no CSV or live data, no email, and the public page pauses. Test-mode product "SimpleDash Starter" with VAT-inclusive €9 and €90 prices (SaaS tax code). `docs/billing.md`.
- **Weekly email:** React Email template, the hourly job (Monday 13:00–17:59 local, claims in `email_send`, Resend batches, `List-Unsubscribe` one-click), the signed unsubscribe page and endpoint, the dashboard notice, the settings switch. `docs/email.md`.
- **Public page** `/p/<slug>`: cached data (`"use cache"`, tag `public:<slug>`), the chosen cards with the server-rendered chart, the Right now card fetching in the browser, "Powered by SimpleDash", the paused page, metadata and its own social image, `/api/p/<slug>/live`, sitemap entries, and `Cache-Control: s-maxage=600` (checked on the production build). The dashboard's "Share your stats publicly?" card turns it on in one click. `docs/public-page.md`.
- **Settings in full:** account, weekly email, public page form (address, cards, indexing, copy link), billing in plain words, disconnect Google, delete account. Split into `SettingsView` with dev previews `/ui-kit/settings` and `/ui-kit/public`.
- **Hardening:** Sentry on the server only (all data collection off, cron monitor on the weekly email), `/admin` usage counts, the backup container (`scripts/backup/`) with `docs/backup.md`.
- **Restore test:** dumped Supabase with `backup.sh --local` and restored it into a throwaway Postgres 17.11 (no Docker on this Mac): every table, index and migration came back.
- **Lighthouse** (local production build): landing mobile 96–99 / 100 / 100 / 100 and desktop 100s; privacy and terms 98 / 100 / 100 / 100 mobile, 100s desktop; the public page preview 97 / 100 / 100 mobile and 100 / 100 / 100 desktop (SEO 66 only because the preview is `noindex`). Settings, dashboard and the small pages: accessibility and best practices 100.
- **Launch kit:** `docs/launch.md` (Product Hunt page, Indie Hackers post, X thread) and 7 screenshots in `docs/launch/`.
- Checked at 375, 768 and 1440 px: settings (every state), the public page (all cards, default, paused), the dashboard with the notice and share card, unsubscribe, account deleted, sign-in after disconnect.
- 239 unit tests pass; typecheck and lint are clean.

### Reviews

- **Code review (15 findings, all fixed):** sign-out wrote cookie deletions without `Secure`, which browsers ignore for `__Secure-` cookies; the weekly email could send a cached copy of another week when Google couldn't be asked; a deploy during the send could lose a week's email (claims are now taken over after 30 minutes); the backup pipeline hid `pg_dump` failures (`pipefail`); a subscription paid after account deletion would keep charging (now cancelled and reported); the public Right now card jumped while loading; `SENTRY_DSN` was read outside `env.ts`; public live polls hit the database every time (60-second lookup cache); a failed Stripe check could still delete the account; double-click and slug races; an N+1 sitemap query; unknown-price alerts for unrelated products; unsubscribe for deleted accounts; the admin page's title; 12 count queries.
- **Security review (manual, as before: the command needs a git remote):** backups no longer contain session tokens (`session` and `verification` rows are left out); a malformed URL hash could crash the settings page. Everything else checked out: webhook signature first, prices chosen on the server, HMAC unsubscribe tokens with a confirm button, no private data on public pages, every action starts with `requireUser()`.

### Learned

- **Dates inside raw sql`` templates break with Drizzle's postgres.js setup:** the driver only converts a Date bound to a column. The billing upsert had `${stateAt}` in a raw template, so every update to an existing billing row would have failed in production. Unit tests used fakes and couldn't see it; running the new queries against the restored copy did. Use `lte()`, `gt()` and friends, never a raw Date.
- A page streamed inside Suspense can't change its status code, so an unknown public page is "Page not found" with `noindex` and status 200 (logged in DECISIONS).
- Lighthouse's simulated mobile score on the landing page moves between 96 and 99 with this Mac's load: the observed paint is 50 ms either way.
- Next.js keeps a `Cache-Control` header from `next.config.ts` on partially prerendered pages.
- In Sentry v11, `sendDefaultPii` is gone; `dataCollection` controls what is sent.

### Next (mostly Siamak's part, see the checklist)

1. Sign in once with your real Google account on localhost and check the dashboard, then the Monday email with `node scripts/run-job.mjs weekly-email` on a Monday afternoon (or ask Claude for a one-off test send).
2. Stripe live mode: Managed Payments, the product and prices, the webhook endpoint, and the Portal's "switch plans" setting (it's off in test mode too).
3. Resend domain, R2 bucket and token, Sentry project with the uptime monitor, the Coolify scheduled tasks (`docs/deploy.md` steps 6–10, `docs/backup.md`).
4. Rotate the Supabase password before launch.
5. Fill in `src/config/legal.ts`, deploy, then Google's app verification.
6. Review and post the launch kit.

### Ideas (outside the roadmap, not built)

- A "Send me a test email" button in settings, so people can see the Monday email before Monday.
- Let the public page show a custom title instead of the domain.

## 2026-10-11 · Session 3 · Sprint 4 started (stopped at the usage limit)

### Done so far

- Schema and migration `0003_email_public_page_billing.sql`: `user_settings`, `public_page`, `billing` (with `state_at`, so older Stripe events can't overwrite newer ones), `email_send`, `stripe_event`. It ends with a backfill that gives existing users a 14-day trial and default settings.
- Installed (pinned): `stripe` 23.0.0 (API `2026-09-30.endive`; Managed Payments is `managed_payments: { enabled: true }` on the Checkout Session), `resend` 6.32.1, `@react-email/components` 1.0.12, `@sentry/nextjs` 11.6.0. These still need lines in DECISIONS (the plan already names them).
- The Stripe test account already has two unrelated products, "STANDARD" and "BASIC" (USD). They're left alone. The account is in NL with EUR as the default currency.

### Next (Sprint 4 plan)

1. Create the Starter product (tax code `txcd_10103001`) with two VAT-inclusive EUR prices (900 a month, 9000 a year). Put the IDs in `.env` as `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`, and add the Sprint 4 keys to `env.ts`.
2. Billing:
   - `getPlan` and the locked state (dashboard overlay with `BillingSwitch` + "Upgrade"; reports read from cache only).
   - `startCheckout`, the Customer Portal, and the webhook with tests.
3. Weekly email: the React Email template, the unsubscribe token (HMAC) with tests, the `weekly-email` job with the Resend batch API, the dashboard notice, and the switch in settings.
4. Public page `/p/[slug]`:
   - Cached data, `updateTag` on changes, the paused state, a per-page Open Graph image.
   - `/api/p/[slug]/live`, and public pages in the sitemap.
5. Settings in full: disconnect Google, delete account (type DELETE).
6. Hardening: Sentry (server only), the backup container and `docs/backup.md`, `/admin` usage counts.
7. Final Lighthouse pass, the launch kit, the reviews, the docs.

## 2026-10-11 · Session 3 · Sprint 3 built (the extras)

### Done

- **AI traffic card:** assistants and their landing pages. It counts GA4's "AI Assistant" channel or our domain list.
- **Actions card:** downloads, outbound clicks, form submits and signups. Zero rows are hidden, with an Enhanced Measurement how-to when everything is zero.
- **Live globe ("Right now"):**
  - Data: three Realtime API calls with a 60-second cache per property, then `/api/live`.
  - Rendering: a server-rendered list first; cobe loads only when the card is on screen and WebGL works.
  - Behaviour: it polls about every 45 seconds while the tab is visible, pauses off screen, doesn't spin with reduced motion, and the count is in a polite `aria-live` region.
  - **Place data switched from Natural Earth to GeoNames** (CC BY 4.0, via `all-the-cities`): about 14,000 cities and population-weighted country centres, in a 365 KB server-side table. The credit is in the privacy policy and the card's help.
- **Chart notes:** the `chart_note` table (migration 0002), add, edit and delete. A note opens from a click on a day, its marker, or the notes list. Empty hint: "Add a note, like 'Launched on Product Hunt'". Never on public pages.
- **CSV on every card:** `/api/csv/<card>?range=`, from the cache, RFC 4180, formula-safe.
- **Landing page:**
  - Hero exactly as in the roadmap.
  - A demo dashboard: the real cards on sample data, a new server-rendered SVG chart, and a tiny date-switch island. Its dates refresh daily via `"use cache"`.
  - How it works, a "why" row, the **pricing section** (built early: a CSS-only Monthly / Yearly switch from `plans.ts`), the FAQ (native `<details>`) and `SoftwareApplication` JSON-LD.
- **SEO:** unique titles, canonicals, an Open Graph image drawn from the theme, `robots.txt`, `sitemap.xml` and `llms.txt`.
- **Lighthouse** (local production build):

  | Page | Mobile (Perf / A11y / BP / SEO) | Desktop |
  | --- | --- | --- |
  | Landing | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | Privacy | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | Terms | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

  The landing page started at 95 on mobile. Two changes brought it to 99: dropping Geist Mono (25 KB preloaded everywhere) and `display: "optional"` for Geist (the hero text no longer waits for a font swap).
- `docs/google-verification.md`: the scope justification and a demo video script for Siamak.
- 201 unit tests pass.

### Reviews

- **Code review** found 8 things, all fixed:
  - The globe kept spinning off screen.
  - Icons weren't cached at the origin or Cloudflare.
  - The sitemap parsed a free-text date (now ISO).
  - The GeoNames switch wasn't logged and had no credit.
  - Duplicate "Unknown" live keys.
  - The live card ran for a site that had just been revoked.
  - The range window was computed twice.
  - An inconsistent prop name.
- **Found while testing:** Tailwind's reset removes the browser's popover centring (`margin: auto`). Restored in `globals.css`, which also fixes the help popovers in browsers without anchor positioning.
- **Security review** (by hand): new endpoints check the user and their own site; CSV file names are sanitised and cells formula-safe; notes are scoped by site; JSON-LD is escaped; the icon cache is capped. Nothing open.

### Learned

- **Lighthouse 13** has an "agentic browsing" category. Its `llms.txt` audit wants Markdown links (`[text](url)`).
- **Cache Components:** `"use cache"` plus `cacheLife("days")` is the way to use the time on a static page.
- **Dev mode:** after many hot reloads, a tab can stop hydrating Suspense content. A fresh tab fixes it, so test in a new tab before chasing a bug.
- **React 19's `onToggle`** passes `newState` for popovers.

### Problems

- **Still waiting on the migrations and a real sign-in,** for the AI channel name check and the "numbers match GA4" check.

### Test data in Supabase (delete before launch)

- None yet.

### Next

- Sprint 4: the weekly email, the public page, Stripe, settings (disconnect and delete), production hardening, the final Lighthouse pass and the launch kit.

## 2026-10-11 · Session 3 · Sprint 2 built (core dashboard)

### Done

- **Summary line** (`src/lib/summary/summary.ts`): rules 1–5 from SPEC section 11.1, with 20 tests. It never names an unknown source.
- **Visitors chart:**
  - Recharts through shadcn charts, loaded in its own chunk, with a placeholder of the same size.
  - Yesterday is dashed and labelled "Still updating"; dots when there are few points.
  - A screen-reader caption, and a CSS-only "View as table".
  - Data prep in `src/lib/charts/series.ts` (tested), so the static SVG chart can reuse it.
- **The hourly 7-day chart was checked on a small site and didn't read well** (a comb of 0s and 1s). **7 days is daily now.** SPEC section 8 and DECISIONS are updated, and the hourly code paths are gone.
- **Cards:** Sources (Sources | Channels, with site icons), Pages (Top pages | Landing pages), Countries (flags and share), Devices (share bars). All use the shared `RankedList` with a CSS-only "Show more".
- **Signups picker:** the property's key events (Admin API, kept 10 minutes), or a how-to. A pencil button changes it later. Saving checks the event against the live list.
- **New shared blocks:** `SegmentedRadio`, `ViewToggle`, `RankedList`, `Flag`, `SiteIcon`, `PopoverButton`. All are on `/ui-kit`.
- **Site icon proxy** `/api/icon/<domain>`: DuckDuckGo only, strict host check, no redirects, type allowlist, a 64 KB cap read while streaming, and cached for 30 days.
- **Flags:** 257 PNGs (48 × 36) made with sharp, about 106 KB in total, instead of SVGs of up to 177 KB.
- **Checked** on `/ui-kit/dashboard`:
  - At 320, 375, 768, 1024 and 1440 px: no horizontal scrolling, and the numbers and chart fit above the fold at 1440 × 900.
  - Keyboard: every control has a name, in a sensible order, with visible focus.
  - Lighthouse: Accessibility 100 and Best Practices 100, mobile and desktop.
- 170 unit tests pass.

### Reviews

- **Code review** found 12 things, all fixed:
  - DECISIONS didn't record the daily switch.
  - "mostly from Unknown".
  - The key-events lookup called Google for revoked sites.
  - Silent save failures.
  - The picker preselected a different event.
  - A malformed icon URL caused a 500.
  - The share column was hidden on phones.
  - The popover stayed open after saving.
  - Big flag SVGs.
  - Duplicate "Unknown" keys.
  - Direct was detected by its label.
  - The icon size cap was checked after a full download.
- **Security review** (by hand): GA4 data can be faked by outsiders (referrer spam, Measurement Protocol). It's rendered only as escaped text, and icon URLs only use strictly checked host names. Nothing new found.

### Learned

- **Touch targets versus narrow cards:** a 44 px button squeezes a 2-column grid at 320 px. An invisible `after:` overlay keeps the target size without taking layout space.
- **A native popover keeps its open state across a server action's refresh,** so the form closes it with `hidePopover()` after a save.
- **`next/image` serves local SVGs and PNGs as they are** (`unoptimized`), which is what we want for tiny icons.
- **Screenshots right after load can miss the lazy chart:** dev mode compiles the chunk on first use. Check the DOM before deciding it's broken.

### Problems

- **Still no real-data check:** the migrations aren't applied, and the "numbers match GA4" check is Siamak's (SPEC section 11 lists which GA4 report to compare for each card).

### Test data in Supabase (delete before launch)

- None yet.

### Next

- Sprint 3: AI traffic, Actions, the live globe, chart notes, CSV, the landing page, SEO files and Lighthouse.

## 2026-10-11 · Session 3 · Sprint 1 built (connect Google)

### Done

- **Better Auth** (`src/lib/auth/`):
  - Google only, with read-only Analytics and offline access, consent every time, and encrypted tokens.
  - 30-day database sessions with a 5-minute cookie cache. IP tracking is off.
  - Sign-in and sign-out are server actions (form posts, no JavaScript).
  - Only Google's callback is reachable over HTTP.
- **Google tokens:**
  - `getGoogleAccessToken` uses Better Auth's refresh. When that fails, we ask Google directly, so a revoke (`invalid_grant`) is told apart from a blip.
  - Tokens are reused per user for 10 minutes.
- **GA4 data layer** (`src/lib/ga4/`, all in `docs/ga4.md`):
  - ranges per time zone, the 11 report requests and parsers, labels, the AI list
  - error mapping, a per-property limiter and breaker
  - the report cache: stale shown at once and refreshed with `after()` under a lease, missing fetched now, failed batches don't discard good ones
  - the automatic property choice, the switcher, sample data, and the four numbers
- **Screens:**
  - `/signin`.
  - `/dashboard` with the top bar (switcher, date switch, settings), the 4 number cards, and every state: no property (sample data), no data, access not granted, revoked, lost access, quota, Google not answering.
  - A minimal `/settings` (account, sign out).
  - `/privacy` and `/terms`, written early because the links need them. Placeholders for the legal details are in `src/config/legal.ts`.
- **Jobs:**
  - `POST /api/internal/jobs/<job>` with the bearer secret.
  - `warm-cache` and `cleanup`.
  - `scripts/run-job.mjs` for Coolify.
- **Migration** `0001_sites_and_report_cache.sql`: `site` (one active per user, with a partial unique index) and `report_cache`.
- **Dev preview:** `/ui-kit/dashboard?state=…` shows the dashboard in every state on sample data. Checked at 375 px and desktop.
- `docs/ga4.md` and `docs/auth.md`. 140 unit tests pass.

### Reviews

- **Code review** found 13 things, all fixed:
  - A failed batch threw away the good batches.
  - The warm-cache subquery is now `inArray` (the SQL output was checked).
  - The limiter handoff let a 6th request through (test added).
  - Each batch looked up and refreshed the token on its own.
  - "Not enough history" showed for missing values.
  - `serviceLevel` was stored as an enum number.
  - The terms had an extra refund promise (removed).
  - Job names matched prototype keys.
  - The lost-access recheck ran on every view.
  - The concurrent-quota 429 caused an hourly block.
  - Duplicated types and header.
  - A failed decrypt sent ciphertext to Google.
- **Security review** (by hand, since the skill needs a git remote). Found and fixed:
  - **Better Auth's `/api/auth/refresh-token` would return the decrypted Google refresh token to the browser**, and `/get-access-token` the access token. Now only the callback path reaches Better Auth over HTTP; both answer 404 (checked).
  - Session IP addresses were stored. Tracking is now off, and the privacy policy mentions sessions.
  - Checked and fine: the job endpoint (constant-time bearer), the switcher (checks the property against the user's own list), SQL (parameterised), and output (React escapes; the only HTML injection is the theme CSS).

### Learned

- **Cache Components:**
  - `new Date()` during prerendering is an error. Components that use the time call `await connection()` first.
  - Passing a plain function to `<form action>` needs `"use server"`.
- **The `react-hooks/purity` lint** flags `Date.now()` in render, even in dev pages.
- **Better Auth 1.7:** `auth.api.getAccessToken` needs `{ userId, accountId }`, where `accountId` is the account row's ID. `disabledPaths` only applies to HTTP requests.
- **The GA4 REST transport:** errors carry a gRPC `code` and an `httpStatusCode`. The async pager warns about `autoPaginate`, so we page by hand.
- **Drizzle:** `inArray(col, subquery)` renders the parentheses. Raw `sql` interpolation is riskier.
- **rtk:** its Vitest parser sometimes can't read the output. `rtk proxy npx vitest run` shows the real result.

### Problems

- **The migrations still aren't applied** (Siamak's terminal, see Sprint 0). Until then, real sign-in can't be tested: the OAuth state lives in the `verification` table.
- **The real Google flow is untested:** sign-in, scope check, property choice and numbers against a real property. Siamak needs to sign in himself; Claude doesn't enter passwords.

### Test data in Supabase (delete before launch)

- None yet.

### Next

- **Siamak:**
  - Run `npm run db:migrate`.
  - Check that both redirect URIs are on the Google OAuth client, and that the Data and Admin APIs are enabled.
  - Sign in at http://localhost:3000/signin.
- **Claude:** Sprint 2, the core dashboard.

## 2026-10-11 · Session 3 · Sprint 0 built (project setup)

Siamak asked for all of V1 (Sprints 0–4) in one go, checking each sprint with typecheck, lint, tests, a code review and a security review. This entry covers Sprint 0.

### Done

- **Scaffold:** Next.js 16.4 (Cache Components, Partial Prefetching, typed routes, standalone output), React 19.3, TypeScript 6.0.3, Tailwind 4.3, ESLint 10, Prettier, Vitest 5. Written by hand: `npx create-next-app` was blocked by the permission check.
- **Theme file** `src/config/theme.ts`, `ThemeStyle`, the Tailwind mapping in `globals.css` and all four guards. The guard tests and a throwaway "bad" file show that each one fires.
- **Component base:** layer import rules in ESLint, shadcn parts (button, badge, card, separator, skeleton, input, label) moved onto tokens, `Logo` and `Container`, and `/ui-kit` (a 404 in production). How it works: `docs/ui.md`.
- **Database:** Drizzle with postgres.js, Better Auth's 4 tables generated with `npx auth generate`, and the first migration in `drizzle/`. TLS is forced for remote databases.
- **Env:** `.env.example` documents every key. In `.env`, `DATABASE_URL` is now the Supabase **session** pooler (port 5432, password percent-encoded). The direct and transaction URLs were removed. Generated `BETTER_AUTH_SECRET`, `CRON_SECRET` and `EMAIL_TOKEN_SECRET`, and added `APP_URL`, `EMAIL_FROM` and `ADMIN_EMAILS`.
- **Docker:** `Dockerfile` (3 stages, non-root, migrations at start, `HEALTHCHECK`) and `compose.yaml` (local Postgres on 127.0.0.1, and the app under the `app` profile).
- `/api/health`, the hello page, favicons drawn from the theme, `not-found` and `global-error`.
- `docs/deploy.md`: Supabase, Hetzner, Coolify (with the Cloudflare Origin Certificate), Cloudflare rules, scheduled tasks and the Google redirect URIs.
- CodeGraph initialised (37 files indexed).

### Lighthouse baseline (local production build, hello page)

| | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile | 98 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Mobile: FCP 0.8 s, LCP 2.3 s, TBT 10 ms, CLS 0. Run it again on the real domain after the first deploy.

### Reviews

- **Code review** found 11 things. All are fixed:
  - Env validation read the whole set on every read. The Docker build (which only has `APP_URL`) would have failed. Now each key is checked when read, and the whole set when the server starts. Tested with a build that had no `.env`, and a start without `DATABASE_URL` (it fails fast with the variable's name).
  - The Apple icon had transparent rounded corners, which iOS fills with black.
  - A stale Drizzle schema after hot reloads.
  - Card edges bypassed the `border` token.
  - The health-check timer was never cleared.
  - A `process.env` read outside `env.ts`.
  - Missing Proxy traps, the global-error font, the git-ignore for `.claude/settings.local.json`, drizzle-kit credentials, and missing DECISIONS lines.
- **Security review:** the `/security-review` skill needs a git remote (`origin/HEAD`), and this repo has none, so the review was done by hand. Found and fixed:
  - The Supabase pooler accepts plain-text connections, and postgres.js doesn't ask for TLS by default. TLS is now required for every non-local host (`src/lib/db/ssl.ts`, also in `scripts/migrate.mjs`).
  - Local Postgres was published on all interfaces with a dev password. It's now 127.0.0.1 only.
  - Change the Supabase password before launch (`docs/deploy.md` step 1).

### Siamak's answers (this session)

- Use **Supabase as the dev database** until Docker is installed.
- **Prices include VAT.**
- **Yearly refunds:** in full within 14 days.
- **Legal pages:** marked placeholders for now.

### Learned

- **shadcn CLI 4** uses the "radix-nova" style and `@import "shadcn/tailwind.css"`. Without `baseUrl` in tsconfig, it wrote `import { cn } from "cn"` and **installed an unrelated npm package called `cn`**. Fixed by hand, and noted in `docs/ui.md`.
- **Tailwind's default `dark:`** follows the OS. It's now class-based, so the light-only theme stays light.
- **Next.js 16.4:** `cacheComponents` wants `partialPrefetching` set explicitly. The docs ship in `node_modules/next/dist/docs/`.
- **Better Auth 1.7:** the Drizzle adapter is the separate `@better-auth/drizzle-adapter`, pulled in by `better-auth/adapters/drizzle`.
- **The Supabase project is in eu-west-1 (Ireland)**, on Postgres 17.11.
- **zsh:** `echo ====` fails, because `=word` expands to a command path. Use `echo ---`.

### Problems

- **The permission check blocks writes to Supabase** (`npm run db:migrate`), even after Siamak's OK in chat. Siamak runs the migration himself, or allows `Bash(npm run db:migrate)` in `.claude/settings.local.json`.
- **No Docker,** so the image is untested in Docker itself.
- **Deploy** (Hetzner, Coolify, Cloudflare) is Siamak's part. The Sprint 0 "Done when" stays open until `/api/health` answers on simpledash.app.

### Test data in Supabase (delete before launch)

- None yet.

### Next

- Sprint 1: Google sign-in, automatic property choice, the GA4 data layer and cache, and the states.

## 2026-10-11 · Session 2 · Pricing, theme file and UI rules (Sprint 0, before code)

### Done

- **Pricing** (Siamak's request): the €9 plan is now called Starter and also comes yearly at €90 (2 months free). Growth (€19 a month) shows as "Coming soon" in the pricing section.
  - Written into SPEC sections 1, 5, 9, 12, 16, 17, 20 and 22–27.
  - Also in CHECKLIST Sprints 3–4, DECISIONS, README and CLAUDE.md.
- **One theme and brand file:** `src/config/theme.ts` holds every colour, radius, shadow and brand fact. Guards make sure the code only uses its tokens (SPEC section 18).
- **UI quality bar** and **code structure and reuse rules:** SPEC sections 18 and 4, plus new conventions in CLAUDE.md.
- **Sprint 0 checklist:** new tasks for the theme file and the component base, with a dev-only `/ui-kit` page.
- **No more section signs:** Siamak asked what the section sign was. Every one in the docs is now plain words ("section 16"), and CLAUDE.md has a rule against symbols like it.
- No app code, no installs, no git. `docs/ROADMAP.md` is untouched.

### Siamak's answers

- Pricing is a section on the landing page (`/#pricing`), not its own page.
- The €9/€90 plan is called **Starter**.
- A **Monthly / Yearly switch** on the pricing section. Growth always shows €19 a month.
- **Light theme only** in V1. Dark mode stays an idea, and the theme file is ready for it.
- **UI:** Siamak likes DataFast's UI because it is "perfect", not because of its looks, and doesn't want it copied. It sets the bar for polish.

### Learned

- Email clients and the Open Graph image renderer need plain hex colours. So the theme file uses hex, and the CSS variables are written from it.
- Next.js needs `next/font` calls in their own module, so fonts are the one thing outside the theme file (`src/lib/theme/fonts.ts`).
- **Versions on npm today:**
  - lucide-react 1.55
  - class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.7, tw-animate-css 1.4
  - server-only 0.0.1
  - shadcn 4.21.4, tailwindcss 4.3.3, next 16.4.0

### Problems

- **ugrep and `|`:** it treats `|` in a pattern as "or", so searching Markdown tables matches almost every line. Use Python for those searches.

### Ideas (outside the roadmap, for later)

- A yearly price for Growth when it launches.
- Dark mode that follows the system setting. It's still an idea, but now only one palette away.

### Next

- **Siamak:**
  - Review the new SPEC sections 4, 16, 17 and 18, and the new rows in `docs/DECISIONS.md`.
  - Before Sprint 3, decide whether the prices include VAT and the refund rule for yearly plans (SPEC section 27).
  - The Sprint 0 account setup from Session 1 still stands.
- **Claude, Sprint 0 (updated order):**
  1. Scaffold Next.js 16 with TypeScript 6.0, Tailwind 4 and shadcn/ui.
  2. Set up ESLint, Prettier and Vitest, with `npm run check`.
  3. Run `codegraph init -i`.
  4. Build the theme file, `ThemeStyle`, the Tailwind mapping and the guards (palette removed, lint rules, mapping and contrast tests).
  5. Build the component base:
     - the folder layers and their import rules
     - the first shadcn parts, moved onto tokens
     - `Logo` and `Container`
     - `/ui-kit`
     - `docs/ui.md`
  6. Set up Drizzle, local Postgres in Compose, and the first migration (Better Auth tables).
  7. Write `.env.example`, the Dockerfile and `compose.yaml`.
  8. Add `/api/health` and the "hello" page, using the theme.
  9. Write `docs/deploy.md`.
  10. Run the Lighthouse baseline.

## 2026-10-11 · Session 1 · Planning (start of Sprint 0)

### Done

- Read `docs/ROADMAP.md`.
- Checked every fact it marks "from memory, verify" against official docs and npm. Details and sources are in `docs/SPEC.md` section 25.
- Asked Siamak 4 questions. Answers:
  - Ranges are full days ending yesterday.
  - Better Auth instead of Auth.js.
  - Stripe Managed Payments for tax.
  - When a trial ends unpaid, the email and public page pause too.
- Wrote `CLAUDE.md`, `README.md`, `docs/SPEC.md`, `docs/CHECKLIST.md`, `docs/STORY.md` and `docs/DECISIONS.md`. Ticked the first Sprint 0 task.
- No app code, no installs, no git.

### Learned

- **AI channel:** GA4 now has a built-in **"AI Assistant"** channel (ChatGPT, Gemini, Deepseek, Copilot, Grok). It doesn't name Claude or Perplexity, so the AI card also matches our own domain list.
- **Realtime:** the API has **no page path**, only `unifiedScreenName` (the page title). Live pages will show titles.
- **Key events:** `keyEvents` only counts from when an event was marked as a key event, so Signups uses `eventCount` of the chosen event.
- **Quotas:** besides the token quotas, **10 server errors per hour per property** blocks our project for that property. Retry carefully.
- **Freshness:** standard properties' intraday data is 2–6 h behind. Daily data takes about 12 h, and "can take 24–48 hours". That's why the Monday email goes out at 13:00 local time.
- **Google OAuth:**
  - "Testing" status means refresh tokens expire after 7 days (confirmed).
  - Users can untick scopes on Google's consent screen, so we check the granted scopes.
- **Supabase free:** projects "may pause" after 7 days of low activity. Use the shared pooler in session mode, which works over IPv4. The direct connection is IPv6-only and won't work from Docker.
- **Resend free:** 3,000 emails a month but only 100 a day.
- **Sentry free:** includes 1 uptime monitor and 1 cron monitor. UptimeRobot's and Better Stack's free tiers are for hobby use.
- **Versions on npm today:**
  - next 16.4: `proxy.ts`, no `next lint`, Cache Components. With Cache Components, `export const revalidate` is gone; use `"use cache"`.
  - TypeScript latest is 7.0.2, but typescript-eslint needs < 6.1, so we pin 6.0.3.
  - The Better Auth CLI is now the `auth` package.
- **Next.js docs:** any page can be fetched as Markdown with the header `Accept: text/markdown`. There is an index at `nextjs.org/docs/llms.txt`.

### Problems

- **WebSearch and WebFetch** failed all session with a model-access error. Workaround: `curl` the official page, then strip it to text with a small inline Python filter.
- **`grep` is aliased to ugrep** here and rejects long regexes. Use Python for complex text searches.
- **Docker and pnpm aren't installed** on this Mac. Node is 22.22, and Node 24 is recommended. Siamak will install Docker Desktop or OrbStack.
- **CodeGraph isn't initialised** (there is no `.codegraph/` yet). Run `codegraph init -i` right after the Next.js scaffold. Until then, the codegraph tools answer "no project loaded".

### Ideas (outside the roadmap, for later)

- Dogfooding: put GA4 on simpledash.app and publish our own public page. This needs a consent banner and has to be weighed against the Lighthouse 100 target.
- Dark mode that follows the system setting.
- % change on each row of Sources and Pages.
- Automatically delete accounts that have been locked for 12+ months (data minimisation).
- CSV download on public pages.

### Next

- **Siamak:**
  - Review `docs/SPEC.md` and the "Claude" defaults in `docs/DECISIONS.md`.
  - Answer the 3 open questions in SPEC section 27 before Sprint 3.
  - Install Docker.
  - Start the Sprint 0 account setup: Supabase, Hetzner with Coolify, Cloudflare.
- **Claude, Sprint 0:**
  1. Scaffold Next.js 16 with TypeScript 6.0, Tailwind 4 and shadcn/ui.
  2. Set up ESLint, Prettier and Vitest, with `npm run check`.
  3. Run `codegraph init -i`.
  4. Set up Drizzle, local Postgres in Compose, and the first migration (Better Auth tables).
  5. Write `.env.example`, the Dockerfile and `compose.yaml`.
  6. Add `/api/health` and the "hello" page.
  7. Write `docs/deploy.md`.
  8. Run the Lighthouse baseline.
