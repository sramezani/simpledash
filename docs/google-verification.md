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
   - Scopes: `openid`, `email`, `profile`, `.../auth/analytics.readonly`, and since V2 (Sprint 6) `.../auth/webmasters.readonly`
   - Publishing status: **In production**

## Where to submit

Google Cloud Console → **Google Auth Platform** → **Verification Center**: <https://console.cloud.google.com/auth/verification> (pick the SimpleDash project at the top). Fill in the steps above under **Branding**, **Audience** and **Data Access** first (<https://console.cloud.google.com/auth/overview>), then choose **Prepare for verification** / **Submit**.

## Scope justification (paste into the form)

> SimpleDash shows a website owner their own Google Analytics 4 data on one simple dashboard page, in a weekly email and, if they choose, on a public stats page. We request `analytics.readonly` to list the user's GA4 properties (Admin API: account summaries, property details, data streams and key events) and to run reports on them (Data API: visitors, page views, sources, pages, countries, devices and realtime visitors). We never write to the user's Google account. We store only the encrypted tokens, the user's settings and short-lived aggregated report summaries, never data about individual visitors. The weekly email needs offline access to fetch last week's numbers when the user isn't signed in.

## Search Console scope (V2, Sprint 6)

`webmasters.readonly` is also a **sensitive** scope. It isn't asked for at sign-in: only when a Pro user clicks "Connect Search Console" for a site (Better Auth's link flow, `include_granted_scopes`). Add it to the consent screen's scopes and to the verification request; Google reviews it like `analytics.readonly`. Until it's verified, the Connect button still works for test users and anyone allowed through the "unverified app" screen. Also turn on the **Google Search Console API** in the Cloud project (APIs & Services → Library), or every request answers 403.

Scope justification (paste into the form):

> When a user on our paid Pro plan chooses "Connect Search Console" for one of their sites, SimpleDash requests `webmasters.readonly` to list the user's own Search Console properties (`sites.list`) and to run Search Analytics queries on the one they pick (clicks, impressions and positions by search, page and date). We use it to show insights about their own site: searches where they rank 8 to 15, which pages gained or lost Google clicks and the searches behind it, searches with their brand name against other searches, pages with a low click rate for their position, and Google clicks per landing page next to their Google Analytics signups. We never write to Search Console. We store only aggregated report summaries for up to 7 days without use, the chosen property and the user's brand spellings. The scope is never requested at sign-in.

Demo video addition: after step 6 below, upgrade a test account to Pro, open **Settings → Google Search Console**, click **Connect Search Console**, show Google's consent screen with the **"View Search Console data for your verified sites"** permission, allow it, and show the Google search card on the dashboard with its five tabs.

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
