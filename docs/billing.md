# Billing

How the trial, the Starter and Growth plans and Stripe work in the code. The plan is in `docs/SPEC.md` sections 16 and 28.1.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/config/plans.ts` | Plans, prices and limits (`sites`, `searchConsole`, `revenue`): the only place they're written | |
| `src/lib/billing/plan.ts` | Plan state from a billing row: paid (with its plan), trial (with days left) or locked; `entitlements()`, what the account may use; trial end; "keep the trial" rule | yes |
| `src/lib/billing/prices.ts` | Prices in words, "2 months free" worked out from the prices, the plan in words for Settings | yes |
| `src/lib/billing/billing.ts` | Database side: the trial row for new users, `getPlan`, saving a subscription state, unlocked users for jobs | |
| `src/lib/billing/checkout.ts` | Creates the Checkout, Customer Portal and plan-change sessions | |
| `src/lib/billing/webhook.ts` | Turns Stripe events into a subscription state (plan and interval from the price), newest wins | yes |
| `src/lib/billing/stripe.ts` | The Stripe client (2 retries, 20 s timeout) and the four price IDs | |
| `src/app/actions/billing.ts` | `upgrade` and `manageBilling` server actions | |
| `src/app/api/stripe/webhook/route.ts` | The webhook endpoint | |

## Plan state

- A new user gets a `billing` row with `trial_ends_at` = sign-up + 14 days (a Better Auth database hook). No card, no Stripe calls.
- **Paid** when the stored Stripe status is `active`, `trialing` or `past_due`, with `billing.plan` (`starter` or `growth`; rows from before Growth count as Starter). **Trial** before `trial_ends_at`. **Locked** otherwise.
- **What the plan allows** is `entitlements(state)`: paid Growth gets Growth's limits (10 sites, Search Console, revenue); a trial, paid Starter and a locked account get Starter's (1 site, neither). The trial is Starter only (Siamak, Oct 13, 2026). Every server-side check reads this function.
- **Locked** means: the dashboard shows its cached numbers under the "Your free trial has ended." panel and never calls Google; `/api/live` and CSV answer 402; the weekly email and the warm-cache job skip the user; the public page says "This page is paused." Nothing is deleted, and Settings works.

## Upgrade

The locked panel and Settings → Billing hold the same form (`UpgradeForm`): the Monthly / Yearly switch (a radio named `interval`) above a compact card per plan, each with its own submit button (`name="plan"`). The "Upgrade to Growth" panel uses it with Growth only. It posts to the `upgrade` server action, so it works without JavaScript.

1. The action checks `plan` and `interval` with Zod and picks one of the four price IDs (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_YEARLY`). The browser never sends a price ID.
2. **Someone already paying** changes plan in the Customer Portal: a session with the "confirm a subscription update" flow (`flow_data.type = subscription_update_confirm`) preset to the chosen price, which shows Stripe's exact amount before they confirm, then returns to `/dashboard?upgraded=<plan>`. If the Portal isn't set up for switching plans, the plain Portal opens instead (and Sentry gets a note).
3. Checkout: subscription mode, `client_reference_id` and `metadata.userId` (on the session and the subscription), the existing customer or the user's email, `managed_payments: { enabled: true }` (unless `STRIPE_MANAGED_PAYMENTS=false`).
4. With 48 hours or more of the trial left, `subscription_data.trial_end` keeps the rest of the trial: the first charge happens when the trial would have ended. The plan's features start right away (Stripe calls the subscription `trialing`).
5. Success → `/dashboard?upgraded=growth` (or `starter`): "Thank you! Your Growth plan is active." Cancel → `/settings#billing`. A Stripe error → `/settings?billing=error#billing`.

Checked on Oct 13, 2026 in test mode: Checkout for Growth yearly from a trial shows "Try SimpleDash Growth · 8 days free · then €190.00 per year".

## Webhook

`POST /api/stripe/webhook` checks the signature with `STRIPE_WEBHOOK_SECRET` first, then:

- Stores the event ID in `stripe_event` and skips repeats. If handling fails, the ID is removed again so Stripe's retry is handled.
- Handles `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid` and `invoice.payment_failed`. Each one fetches or reads the subscription and stores its status, customer, plan and interval (from the price), period end and "cancels at period end".
- When a state is saved, the account's public pages are refreshed at once (`revalidateTag`), so an upgrade or a lapse shows on them straight away.
- **Newest wins:** each state is stored with the time it was true at Stripe (`state_at`); an older event never overwrites a newer one.
- A price that isn't one of the four is reported to Sentry and counts as Starter: an unknown price never unlocks Growth.
- Events for a deleted account are skipped. If that subscription is still running (someone paid in a Checkout tab after deleting the account), it is cancelled and reported to Sentry, so Siamak can refund it.

## Settings → Billing

Shows the plan in plain words ("Free trial · 9 days left", "Starter · €90 a year · renews on 11 Oct 2027", "Growth · €19 a month · renews on 2 Nov 2026", "Free trial ended on 12 Oct 2026"), then the plan choice (trial and locked) or "Manage billing" (the Portal). Paid Starter also gets "Upgrade to Growth". A failed payment shows a note to update the card.

## Test it locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints a whsec_… secret for .env
```

Use the test card `4242 4242 4242 4242` with any future date and CVC. Check on Oct 12, 2026: Checkout accepts Managed Payments together with `trial_end`.

## Stripe setup (Siamak, live mode)

1. Apply for **Managed Payments** (Stripe Dashboard → Settings → Managed Payments).
2. **Products**, each with the tax code **Software as a service (SaaS) – business use** (`txcd_10103001`) and two **tax inclusive** prices:
   - "SimpleDash Starter": €9 monthly and €90 yearly → `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`.
   - "SimpleDash Growth": €19 monthly and €190 yearly → `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_YEARLY`.
   Both exist in test mode already (Claude made Growth's on Oct 13, 2026, with Siamak's OK).
3. **Webhook endpoint:** `https://simpledash.app/api/stripe/webhook` with the six events above. Its signing secret goes in `STRIPE_WEBHOOK_SECRET`.
4. **Customer Portal** (Settings → Billing → Customer portal): turn on invoices, updating the payment method and cancelling (at the end of the period), and **"Customers can switch plans"** with all four prices (Starter and Growth, monthly and yearly), with prorations on. Add the privacy and terms links. In test mode the Portal works, but plan switching is still off: until it's on, "Upgrade to Growth" for a paying customer opens the plain Portal.
