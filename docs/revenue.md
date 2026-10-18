# Revenue, what brings customers and what changed

Pro's money features: revenue from the user's own Stripe account, and what brings customers from GA4. Also What changed (every plan, more on Pro). The plan is in `docs/SPEC.md` sections 28.3 and 31; this file says how the code does it.

**The rule:** exact numbers only. Revenue is what Stripe recorded; revenue per source is GA4's own purchase value. Nothing is multiplied, matched by time or estimated.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/lib/revenue/totals.ts` | Which keys are accepted, Stripe's reads bucketed by the site's days, MRR, a period's totals, sync days | yes |
| `src/lib/revenue/stripe-reader.ts` | Read calls with the user's key: the four-read check, charges, refunds, customers, subscriptions | checked once against Stripe test mode |
| `src/lib/revenue/revenue.ts` | The stored key (encrypted), the sync into `revenue_day`, and `loadRevenue` for the dashboard | checked once against a local database |
| `src/lib/revenue/sample.ts` | Sample totals for the dev previews | |
| `src/lib/jobs/revenue-sync.ts` | The hourly sync job | |
| `src/lib/ga4/payment-pages.ts` | Payment pages that show up as a source | yes |
| `src/app/actions/revenue.ts` | "Check and save", Remove, "What counts as a sale?" | |
| `src/components/settings/revenue-settings.tsx`, `sale-settings.tsx` | The two Settings cards | |
| `src/components/dashboard/revenue-metrics.tsx` | Revenue and New customers in the overview | |
| `src/components/cards/sales-card.tsx` | What brings customers | |
| `src/lib/customers/counts.ts`, `highlights.ts` | First and last visit counts and paths; the highlight lines | yes |
| `src/lib/changes/breakdown.ts` | What changed: the headline, the moves, their pages, the Google search detail | yes |
| `src/components/cards/what-changed-card.tsx` | What changed | |

The secret helper `src/lib/auth/secrets.ts` encrypts with Better Auth's key, like the Google tokens.

## The Stripe key

1. Settings → Revenue from Stripe shows the steps: Stripe → Developers → API keys → **Create restricted key**, with **Charges**, **Refunds**, **Customers** and **Subscriptions** on **Read** and everything else on None.
2. **Check and save** (`saveStripeKeyAction`): `keyKind` accepts only `rk_live_…` and `rk_test_…`. A secret key (`sk_…`) is refused with "it can change your Stripe account"; a publishable key and anything else are refused too.
3. `checkKey` lists one object of each resource, one at a time. A permission error names the resource ("This key can't read Refunds…"); an authentication error says Stripe doesn't accept the key.
4. The key is saved encrypted with its last 4 characters (`revenue_source`). Saving a new key deletes the old totals (it may be another account). The first sync runs after the response.
5. **Remove** deletes the key and every total for the site.

## Daily totals

- **Read:** succeeded, captured charges (amount, currency, time); succeeded refunds (amount, currency, time); customers (creation time only); active and past-due subscriptions with their prices. Nothing else leaves `stripe-reader.ts`.
- **Stored** (`revenue_day`, one row per site and day in the site's time zone): `money` per currency (`charged`, `refunded`, in the smallest unit), `new_customers`, and `mrr` per currency on the days a sync recorded it.
- **First sync:** 25 months back (`backfillStart`), so 12 months can be compared with the 12 before. `revenue_source.covers_from` remembers the first day covered; a period that starts earlier isn't compared ("Stripe totals start …").
- **Later syncs** (hourly `revenue-sync` at :20, and after a dashboard view when the last sync is over an hour old): from 2 days before the last sync, so a late refund lands on its own day. Those days are replaced; earlier MRR snapshots are kept and today's is recorded.
- **Skipped:** keys marked invalid (Stripe stopped accepting them), sites removed from the list, and accounts whose plan doesn't include revenue (Free).

## What the dashboard shows (Pro, connected)

- **Revenue** = charged minus refunded in the main currency (the one with the most charged), before Stripe's fees. Under it: MRR (the monthly list price of active and past-due subscriptions, before discounts; usage-based prices can't be counted and are named), refunds, other currencies (named, never converted), "test mode" for a test key.
- **New customers** = customers Stripe created in the period, with "1 per 412 visitors" (visitors ÷ new customers, same days).
- **Bars** under the visitors line: revenue per day, or per month on 12 months. None on hourly charts (the totals are daily). The tooltip and "View as table" include it.
- Before Stripe is connected, Revenue shows "Connect Stripe" (to Settings).

## What brings customers (Pro)

- **What counts as a sale** (Settings): a GA4 key event, or views of a page path (`site.sale_event`, `site.sale_page`), or nothing.
- **Last visit** (GA4's session source, which already skips direct visits when an earlier source is known): `goals_sources` / `goals_landing` (event counts by source and landing page), `sale_page_sources` / `sale_page_landing` (thank-you page views), `purchase_sources` / `purchase_landing` (GA4's `purchaseRevenue`).
- **First visit** (GA4's first user source): `first_goals`, `first_sale_page`, `first_purchase`.
- **Paths and days:** `goal_paths` / `sale_page_paths` (first source × session source) and `goal_days` / `sale_page_days` (first-visit day × day, grouped into same day, 1–7, 8–30 and over 30 days when the rows arrive).
- **Loading:** `SalesLoader` makes three `loadReports` calls (last visit, first visit, paths and days), so one refusal from GA4 never hides the rest.
- **The card:**
  - A Signups | Sales switch (CSS radios; Sales first) and the legend.
  - Up to two highlight lines, and the time from first visit.
  - Tabs: By source (First and Last; Details adds revenue by first and last visit), Paths, and Landing pages (the metric and visitors; Details adds revenue).
  - Revenue only when GA4 has purchase values; otherwise the card says so and links our guide.

## What changed (every plan; Signups and Sales on Pro)

- **Reports:** `change_paths` (visitors per source and landing page, both periods), `change_goals` (signup and sale events per source and landing page), and `change_sale_page`. Visitors' totals and sources come from `totals` and `sources`; the signups total from `actions`.
- **Loading:** `ChangesLoader` streams the card under the overview. With Search Console on Pro, it also matches Google's landing pages to Search Console's What changed pages (one load per request, shared with the search card).
- **The card:** a headline, up to 3 moves (3 visitors or 2 events at least), each opening onto up to 3 pages that moved the same way and, for Google, the searches; "See all changes" for every source. Free sees Visitors only.

## The payment-page warning (every plan, dashboard only)

When `checkout.stripe.com` or another payment page (`paymentReferrers`: Stripe, PayPal, Paddle, Lemon Squeezy, Polar) has visitors in Sources, the card opens with a warning: GA4 gives those sales to the payment page; add it to Admin → Data streams → Configure tag settings → **List unwanted referrals**. Public pages never show it.

## Previews

`/ui-kit/dashboard?state=pro` (revenue in the overview, the bars, the sales card and the warning on sample data); `/ui-kit/settings?state=pro` (connected) and `?state=search-off` (not connected).

## Siamak's part

- The `revenue-sync` job runs hourly at :20 from `deploy/crontab` (`docs/deploy.md` step 8); nothing to add by hand.
- The "Done when" check: connect a restricted key from the test Stripe account (make a test charge or two first), compare the daily revenue with Stripe's dashboard, and send a test `purchase` event in GA4.
