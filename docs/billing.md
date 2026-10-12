# Billing

How the trial, the Starter plan and Stripe work in the code. The plan is in `docs/SPEC.md` section 16.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/config/plans.ts` | Plans and prices: the only place they're written | |
| `src/lib/billing/plan.ts` | Plan state from a billing row: paid, trial (with days left) or locked; trial end; "keep the trial" rule | yes |
| `src/lib/billing/prices.ts` | Prices in words, "2 months free" worked out from the prices, the plan in words for Settings | yes |
| `src/lib/billing/billing.ts` | Database side: the trial row for new users, `getPlan`, saving a subscription state, unlocked users for jobs | |
| `src/lib/billing/checkout.ts` | Creates the Checkout and Customer Portal sessions | |
| `src/lib/billing/webhook.ts` | Turns Stripe events into a subscription state, newest wins | yes |
| `src/lib/billing/stripe.ts` | The Stripe client (2 retries, 20 s timeout) and the two price IDs | |
| `src/app/actions/billing.ts` | `upgrade` and `manageBilling` server actions | |
| `src/app/api/stripe/webhook/route.ts` | The webhook endpoint | |

## Plan state

- A new user gets a `billing` row with `trial_ends_at` = sign-up + 14 days (a Better Auth database hook). No card, no Stripe calls.
- **Paid** when the stored Stripe status is `active`, `trialing` or `past_due`. **Trial** before `trial_ends_at`. **Locked** otherwise.
- **Locked** means: the dashboard shows its cached numbers under the "Your free trial has ended." panel and never calls Google; `/api/live` and CSV answer 402; the weekly email and the warm-cache job skip the user; the public page says "This page is paused." Nothing is deleted, and Settings works.

## Upgrade

The locked panel and Settings → Billing hold the same form: the Monthly / Yearly switch (a radio named `interval`) and "Upgrade". It posts to the `upgrade` server action, so it works without JavaScript.

1. The action checks `interval` with Zod and picks `STRIPE_PRICE_MONTHLY` or `STRIPE_PRICE_YEARLY`. The browser never sends a price ID.
2. Someone already paying is sent to the Portal instead.
3. Checkout: subscription mode, `client_reference_id` and `metadata.userId` (on the session and the subscription), the existing customer or the user's email, `managed_payments: { enabled: true }` (unless `STRIPE_MANAGED_PAYMENTS=false`).
4. With 48 hours or more of the trial left, `subscription_data.trial_end` keeps the rest of the trial: the first charge happens when the trial would have ended.
5. Success → `/dashboard?upgraded=1` ("Thank you! Your Starter plan is active."). Cancel → `/settings`. A Stripe error → `/settings?billing=error`.

## Webhook

`POST /api/stripe/webhook` checks the signature with `STRIPE_WEBHOOK_SECRET` first, then:

- Stores the event ID in `stripe_event` and skips repeats. If handling fails, the ID is removed again so Stripe's retry is handled.
- Handles `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid` and `invoice.payment_failed`. Each one fetches or reads the subscription and stores its status, customer, interval, period end and "cancels at period end".
- **Newest wins:** each state is stored with the time it was true at Stripe (`state_at`); an older event never overwrites a newer one.
- A price that isn't one of the two Starter prices is stored as best it can and reported to Sentry.
- Events for a deleted account are skipped. If that subscription is still running (someone paid in a Checkout tab after deleting the account), it is cancelled and reported to Sentry, so Siamak can refund it.

## Settings → Billing

Shows the plan in plain words ("Free trial · 9 days left", "Starter · €90 a year · renews on 11 Oct 2027", "Free trial ended on 12 Oct 2026"), then "Upgrade" or "Manage billing" (the Portal). A failed payment shows a note to update the card.

## Test it locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints a whsec_… secret for .env
```

Use the test card `4242 4242 4242 4242` with any future date and CVC. Check on Oct 12, 2026: Checkout accepts Managed Payments together with `trial_end`.

## Stripe setup (Siamak, live mode)

1. Apply for **Managed Payments** (Stripe Dashboard → Settings → Managed Payments).
2. **Product** "SimpleDash Starter", tax code **Software as a service (SaaS) – business use** (`txcd_10103001`), with two prices, both **tax inclusive**: €9 monthly and €90 yearly. Put the two `price_…` IDs in `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`. (The same exists in test mode already.)
3. **Webhook endpoint:** `https://simpledash.app/api/stripe/webhook` with the six events above. Its signing secret goes in `STRIPE_WEBHOOK_SECRET`.
4. **Customer Portal** (Settings → Billing → Customer portal): turn on invoices, updating the payment method and cancelling (at the end of the period), and **"Customers can switch plans"** with both Starter prices. Add the privacy and terms links. In test mode the Portal works, but plan switching is still off.
