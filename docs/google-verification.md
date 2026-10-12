# Google app verification

What Siamak needs to submit SimpleDash for Google's OAuth verification (Sprint 3). `analytics.readonly` is a **sensitive** scope, so Google checks the app before lifting the 100-user cap and the "unverified app" screen. It usually takes 3–5 business days.

## Before submitting

1. The site is live at `https://simpledash.app` with the landing page, `/privacy` and `/terms` (deploy first: `docs/deploy.md`).
2. The legal placeholders in `src/config/legal.ts` are filled in.
3. `simpledash.app` is verified in [Google Search Console](https://search.google.com/search-console) with the same Google account that owns the Cloud project (a DNS TXT record in Cloudflare).
4. The OAuth consent screen (Google Cloud → APIs & Services → OAuth consent screen) has:
   - App name **SimpleDash**, the dash logo (the 180 × 180 icon at `https://simpledash.app/apple-icon` works), and the support email
   - Home page `https://simpledash.app`, privacy policy `https://simpledash.app/privacy`, terms `https://simpledash.app/terms`
   - Authorised domain `simpledash.app`
   - Scopes: `openid`, `email`, `profile`, `.../auth/analytics.readonly`
   - Publishing status: **In production**

## Scope justification (paste into the form)

> SimpleDash shows a website owner their own Google Analytics 4 data on one simple dashboard page, in a weekly email and, if they choose, on a public stats page. We request `analytics.readonly` to list the user's GA4 properties (Admin API: account summaries, property details, data streams and key events) and to run reports on them (Data API: visitors, page views, sources, pages, countries, devices and realtime visitors). We never write to the user's Google account. We store only the encrypted tokens, the user's settings and short-lived aggregated report summaries, never data about individual visitors. The weekly email needs offline access to fetch last week's numbers when the user isn't signed in.

## Demo video (2–3 minutes, unlisted on YouTube)

Record in one take, in English, with the browser's address bar visible.

1. Open `https://simpledash.app`, scroll the landing page, open the privacy policy.
2. Click **See my dashboard, free** → **Continue with Google**.
3. On Google's consent screen, show the app name and the **"See and download your Google Analytics data"** permission, then allow it. (Make sure the address bar shows `accounts.google.com` and the OAuth client ID is visible in the URL.)
4. Land on the dashboard: point at the site name ("Showing: …"), the numbers, the chart, Sources, Pages, Countries and the live globe. Say that all of it is read from Google Analytics, read-only.
5. Open the site switcher to show the list of the user's GA4 properties.
6. Open **Settings** and show **Disconnect Google** and **Delete account** (Sprint 4).

## After submitting

Google may email questions to the support address. Answers usually repeat the justification above: read-only, the user's own data, nothing stored about visitors.
