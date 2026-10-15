# Billing

How Free, Pro and Stripe work in the code. The plan is in `docs/SPEC.md` section 16. Since Oct 14, 2026 there is no trial, and Starter and Growth are gone: everyone starts on Free, and Pro is the one paid plan.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/config/plans.ts` | Free and Pro: names, prices (USD), features and limits (`fullHistory`, `weeklyEmail`, `searchConsole`, `revenue`, `poweredBy`), and `FREE_HISTORY_DAYS`. The only place they're written | |
| `src/lib/billing/plan.ts` | Plan state from a billing row: paid (Pro) or free; `entitlements()`, what the account may use | yes |
| `src/lib/billing/prices.ts` | Prices in words, "2 months free" worked out from the prices, the plan in words for Settings | yes |
| `src/lib/billing/billing.ts` | Database side: the Free row for new users, `getPlan`, saving a subscription state, paying users for Pro-only jobs | |
| `src/lib/billing/checkout.ts` | Creates the Checkout and Customer Portal sessions | |
| `src/lib/billing/webhook.ts` | Turns Stripe events into a subscription state (plan and interval from the price), newest wins | yes |
| `src/lib/billing/stripe.ts` | The Stripe client (2 retries, 20 s timeout) and Pro's two price IDs | |
| `src/lib/ga4/ranges.ts` | `rangeForPlan`, `fitsFreeHistory`, `freeFirstDay`: Free's 30 days, and the date menu's Pro badge | yes |
| `src/app/actions/billing.ts` | `upgrade` and `manageBilling` server actions | |
| `src/app/api/stripe/webhook/route.ts` | The webhook endpoint | |

## Plan state

- A new user gets a `billing` row with no subscription (a Better Auth database hook): that's Free. No card, no Stripe calls.
- **Paid (Pro)** when the stored Stripe status is `active`, `trialing` or `past_due`. **Free** otherwise, including after a subscription ends.
- **What the plan allows** is `entitlements(state)`, read by every server-side check:

  | | Free | Pro |
  | --- | --- | --- |
  | Sites | All of them | All of them |
  | Ranges | Today, Yesterday, 7 and 30 days, custom days inside the last 30 | Everything |
  | Monday email | No | Yes |
  | Google search insights, revenue, sales by source | No | Yes |
  | Public page | Yes, with "Powered by SimpleDash" | Yes, without it |

- **Nothing locks.** Going back to Free keeps everything: every site stays open with its public page, Search Console and Stripe stay connected but hidden, and the Monday email stops until the next upgrade.
- **No site limit** on either plan (Siamak, Oct 15, 2026): the site menu opens any Google Analytics site in the account, and it joins the user's list.
- **Free's 30 days:** `rangeForPlan(range, fullHistory, timeZone)` swaps a longer range for Last 30 days on the dashboard (with a note), in CSV downloads and on public pages. The date menu marks "Last 12 months" with a Pro badge that opens Settings → Plan & billing, and the calendar starts 30 days back.

## Upgrade

Settings → Plan & billing (`/settings/billing`) and the "part of Pro" panels (`UpgradePanel`: more sites, Google search insights, revenue, the Monday email) hold the same form (`UpgradeForm`): the Monthly / Yearly switch (a radio named `interval`) above Pro's compact card and "Upgrade to Pro". It posts to the `upgrade` server action, so it works without JavaScript.

1. The action checks `interval` with Zod and picks `STRIPE_PRICE_MONTHLY` or `STRIPE_PRICE_YEARLY`. The browser never sends a price ID.
2. **Someone already paying** gets the Customer Portal, where monthly and yearly can be switched.
3. Checkout: subscription mode, no trial, `client_reference_id` and `metadata.userId` (on the session and the subscription), the existing customer or the user's email, `managed_payments: { enabled: true }` (unless `STRIPE_MANAGED_PAYMENTS=false`).
4. Success → `/dashboard?upgraded=pro`: "Thank you! Pro is active." Cancel → `/settings/billing`. A Stripe error → `/settings/billing?billing=error`.

Checked on Oct 14, 2026 in test mode: Checkout sessions for Pro with Managed Payments open at $9.00 monthly and $90.00 yearly (USD); they were expired again, nothing was paid.

## Webhook

`POST /api/stripe/webhook` checks the signature with `STRIPE_WEBHOOK_SECRET` first, then:

- Stores the event ID in `stripe_event` and skips repeats. If handling fails, the ID is removed again so Stripe's retry is handled.
- Handles `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid` and `invoice.payment_failed`. Each one fetches or reads the subscription and stores its status, customer, plan (`pro`) and interval (from the price), period end and "cancels at period end".
- When a state is saved, the account's public pages are refreshed at once (`revalidateTag`), so an upgrade or a lapse shows on them straight away (the "Powered by" link, the 30 days).
- **Newest wins:** each state is stored with the time it was true at Stripe (`state_at`); an older event never overwrites a newer one.
- A paid subscription on a price that isn't one of Pro's two (an old Starter or Growth test price) is still Pro, and is reported to Sentry.
- Events for a deleted account are skipped. If that subscription is still running (someone paid in a Checkout tab after deleting the account), it is cancelled and reported to Sentry, so Siamak can refund it.

## Settings → Plan & billing

Shows the plan in plain words ("Free", "Pro · $90 a year · renews on 11 Oct 2027", "Pro · $9 a month · ends on 2 Nov 2026"), then "Upgrade to Pro" (Free) or "Manage billing" (the Portal). A failed payment shows a note to update the card. The weekly email section on Free says the Monday email is part of Pro.

## Moving from Starter and Growth (migration 0007)

`drizzle/0007_pro_plan.sql` sets `billing.plan = 'pro'` on every row that had a paid plan and drops `billing.trial_ends_at`. Old test subscriptions on the Starter and Growth prices keep working as Pro (reported as unknown prices). **Siamak runs `npm run db:migrate`.**

## Test it locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints a whsec_… secret for .env
```

Use the test card `4242 4242 4242 4242` with any future date and CVC.

## Stripe setup (Siamak, live mode)

1. Apply for **Managed Payments** (Stripe Dashboard → Settings → Managed Payments).
2. **Product** "SimpleDash Pro" with the tax code **Software as a service (SaaS) – business use** (`txcd_10103001`) and two **tax inclusive** USD prices: $9 monthly → `STRIPE_PRICE_MONTHLY`, $90 yearly → `STRIPE_PRICE_YEARLY`. It exists in test mode already (Claude made it on Oct 14, 2026: `prod_VRKUUhARi1JbiX`). The old Starter and Growth test products can be archived.
3. **Webhook endpoint:** `https://simpledash.app/api/stripe/webhook` with the six events above. Its signing secret goes in `STRIPE_WEBHOOK_SECRET`.
4. **Customer Portal** (Settings → Billing → Customer portal): turn on invoices, updating the payment method and cancelling (at the end of the period), and **"Customers can switch plans"** with Pro's two prices, with prorations on. Add the privacy and terms links.
