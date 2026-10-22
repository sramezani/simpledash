# Public page

The optional public stats page at `/p/<slug>`, one per site. The plan is in `docs/SPEC.md` sections 15 and 28.1.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/lib/public-page/slug.ts` | Slug rules (3–40 lowercase letters, numbers and dashes; reserved words), a slug from the domain, numbered fallbacks | yes |
| `src/lib/public-page/public-page.ts` | A site's page settings: read, one-click turn on, save | |
| `src/lib/public-page/view.ts` | What a page shows, cached (`"use cache"`, about 10 minutes, tag `public:<slug>`); `publicSiteOf()`, the one rule for "live or paused"; the sitemap list | |
| `src/components/public-page/public-view.tsx` | The page body, the paused page and the "Powered by SimpleDash" footer | |
| `src/components/dashboard/share-card.tsx` | "Share your stats publicly?" on the dashboard | |
| `src/components/settings/public-page-form.tsx` | Settings → Public page | |
| `src/app/p/[slug]/page.tsx`, `opengraph-image.tsx` | The page, its metadata and its social image | |
| `src/app/api/p/[slug]/live/route.ts` | Live numbers when "Right now" is on: the count, or everything the live view shows with `?view=full` | |

## One page per site

`public_page` is keyed on `site_id` (since Sprint 5; migration `0004` moved each page to its owner's active site). Each site has its own address, cards and indexing. Each site's settings page (`/settings/sites/<id>`, opened from the gear in the site menu or the settings menu) edits that site's page, and the dashboard's "Share your stats publicly?" card turns on the page of the site being viewed.

## Turning it on

- **Dashboard:** the "Share your stats publicly?" card (only while the user has never set one up). "Turn on" creates the page with a slug from the domain (`mysite.com` → `mysite-com`, then `mysite-com-2` and so on if taken) and the default cards, then shows the link with **Copy link**.
- **Settings → Public page:** on or off, the address, the cards and "Let search engines index this page" (on by default). Saving drops the cached copy at once (`updateTag`), for the old address too when it changed.

## What it shows

- The chosen cards from `src/config/cards.ts`. Default: summary line, Visitors, Page views, the chart, Sources, Pages, Countries. Signups, Avg. time, Devices, AI traffic and Right now can be added. Actions can't.
- The same three ranges as the dashboard (`?range=30d`, `?range=12m`).
- The chart is server-rendered SVG; the only client code is the live count when Right now is on ("● 3 live" beside the date menu: it fetches its number after load and polls every 20 seconds while visible). Clicking it opens the live view, whose code and globe load only then.
- **Never:** chart notes, the email address, the user's name, settings or the property ID. The signups sentence of the summary appears only when the Signups card is on.

## When it isn't live

- **Paused** ("This page is paused."): the site lost Google access. `noindex`, and out of the sitemap. The Right now endpoint follows the same rule (`publicSiteOf`). Nothing pauses for being on Free: no plan limits the number of sites (since Oct 15, 2026).
- **Removed site:** a site taken off the owner's list shows "Page not found" until it is opened again.
- **Free owners:** the page shows "Powered by SimpleDash" at the bottom and stops at 30 days like their dashboard (12 months is left out of the menu, and an older `?range=` shows Last 30 days). Pro owners' pages have no link and every range. The landing page's demo always has both.
- A plan change from the Stripe webhook refreshes the owner's pages at once; removing a site refreshes its page.
- **Off or unknown slug:** "Page not found" with `noindex`. The status is 200 because the page streams (see `docs/DECISIONS.md`).

## Caching

- The data (`getPublicView`) is cached about 10 minutes and tagged `public:<slug>`. GA4 reports come from `report_cache`, fresh for 12 hours, refreshed with the owner's Google access.
- `next.config.ts` sends `Cache-Control: public, s-maxage=600, stale-while-revalidate=86400` for `/p/<slug>`, and the Cloudflare cache rule for `/p/*` lets most views skip our server.
- `/api/p/<slug>/live` shares the 20-second realtime cache and sends `max-age=20`.

## Preview

`/ui-kit/public?state=default-cards|all-cards|paused` (development only) shows the page on sample data.
