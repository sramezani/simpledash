# Screenshots for docs and guides

Every screenshot slot in `content/`, made by `npm run content:images` (don't edit by hand).
A page shows its screenshot as soon as the file exists; until then the slot renders nothing in production and a dashed box with these instructions in development (docs/SPEC.md section 30).

**How to add one:**

1. Capture what the slot asks for, at desktop width unless it says otherwise. Use a test account or blur emails, names, IDs and anything private.
2. Save it as **WebP** (or PNG) about 1600 pixels wide, named exactly as the slot: `public/content/<id>.webp`.
3. Run `npm run content:images` to tick it off here.

**0 of 28 added.**

## Get started with SimpleDash

Page: `/docs/getting-started`

- [ ] `google-consent-screen` → `public/content/google-consent-screen.webp`
  - **Shows:** Google's consent screen for SimpleDash, asking for read-only access to Google Analytics
  - **Capture:** Sign in to simpledash.app with a test Google account and capture Google's consent screen (the one listing "See and download your Google Analytics data"). Crop to the dialog. Blur the email address.
- [ ] `dashboard-overview` → `public/content/dashboard-overview.webp`
  - **Shows:** The SimpleDash dashboard: four numbers, the visitors chart and the lists below
  - **Capture:** Full-width screenshot of the dashboard (desktop, 1440 px wide) on a real site with some traffic, Last 7 days. Show the four numbers, the chart and the first row of cards. Hide or blur anything private.

## The Monday email

Page: `/docs/monday-email`

- [ ] `monday-email` → `public/content/monday-email.webp`
  - **Shows:** The Monday email: a site's summary line, four numbers, top sources and pages
  - **Capture:** Screenshot of a real Monday email in Gmail (desktop), showing one site's block from the summary down to the button. Blur your email address.

## Share your stats with a public page

Page: `/docs/public-page`

- [ ] `public-page-settings` → `public/content/public-page-settings.webp`
  - **Shows:** The public page settings: on or off, the address, the cards to show and search engine indexing
  - **Capture:** Open a site's settings and capture the "Public page" section: the on switch, the address field, the card checkboxes and "Let search engines index this page". Desktop width.

## Settings and billing

Page: `/docs/settings-and-billing`

- [ ] `settings-pages` → `public/content/settings-pages.webp`
  - **Shows:** SimpleDash settings with the menu on the left: Profile, Plan and billing, Monday email, then each site
  - **Capture:** Capture Settings at 1440 px wide on an account with two or three sites, on the Plan & billing page, so the left menu shows Account and Sites.

## Choose what counts as a signup

Page: `/docs/signups`

- [ ] `signups-picker` → `public/content/signups-picker.webp`
  - **Shows:** The Signups number showing the 'Which action means a signup?' picker with a list of key events
  - **Capture:** On a site with no signup action chosen yet, capture the Signups number showing the picker, with the event list open (for example sign_up, generate_lead, purchase).

## Switch between your Google Analytics sites

Page: `/docs/sites`

- [ ] `site-menu` → `public/content/site-menu.webp`
  - **Shows:** The site menu open, listing Google Analytics sites grouped by account, with a gear next to each of your sites
  - **Capture:** Open the site menu on a Google account with at least two GA4 accounts and a few properties. Capture the open menu with the chip above it. Blur any client names.

## What counts as a sale

Page: `/docs/what-counts-as-a-sale`

- [ ] `what-counts-as-a-sale` → `public/content/what-counts-as-a-sale.webp`
  - **Shows:** The 'What counts as a sale?' setting with three choices: nothing yet, a key event, or views of a page
  - **Capture:** Capture the "What counts as a sale?" section in a site's settings, with "A key event" selected and purchase chosen.

## How to add Google Analytics 4 to a Carrd site

Page: `/guides/add-google-analytics-to-carrd`

- [ ] `carrd-site-analytics` → `public/content/carrd-site-analytics.webp`
  - **Shows:** Carrd's Site Analytics settings with Google Analytics selected as the provider and a GA4 Measurement ID
  - **Capture:** In the Carrd dashboard, open a site's Manage page → Analytics → Select Provider → Google Analytics. Capture the form with a placeholder G-XXXXXXXXXX ID before enabling.

## How to add Google Analytics 4 to a Framer site

Page: `/guides/add-google-analytics-to-framer`

- [ ] `framer-google-analytics` → `public/content/framer-google-analytics.webp`
  - **Shows:** Framer's Site Settings with a GA4 Measurement ID in the Google Analytics Measurement ID field
  - **Capture:** In a Framer project, open Site Settings and capture the "Google Analytics Measurement ID" field with a placeholder G-XXXXXXXXXX ID.

## How to add Google Analytics 4 to a Ghost site

Page: `/guides/add-google-analytics-to-ghost`

- [ ] `ghost-code-injection` → `public/content/ghost-code-injection.webp`
  - **Shows:** Ghost Admin's Code injection settings with the Google tag in the Site header field
  - **Capture:** In Ghost Admin, Settings → Code injection. Capture the Site header field with the Google tag pasted (placeholder G-XXXXXXXXXX ID).

## How to add Google Analytics 4 to a Lovable app

Page: `/guides/add-google-analytics-to-lovable`

- [ ] `lovable-index-html` → `public/content/lovable-index-html.webp`
  - **Shows:** index.html in a Lovable project with the Google tag in the head
  - **Capture:** In a Lovable project's code view, open index.html and capture the head with the Google tag added (placeholder G-XXXXXXXXXX ID).

## How to add Google Analytics 4 to Shopify

Page: `/guides/add-google-analytics-to-shopify`

- [ ] `shopify-google-youtube` → `public/content/shopify-google-youtube.webp`
  - **Shows:** Shopify's Google & YouTube app with a Google Analytics 4 property connected
  - **Capture:** In a Shopify development store, open the Google & YouTube app and capture the settings showing a connected Google Analytics property.

## How to add Google Analytics 4 to Squarespace

Page: `/guides/add-google-analytics-to-squarespace`

- [ ] `squarespace-ga4` → `public/content/squarespace-ga4.webp`
  - **Shows:** Squarespace's External API keys panel with a GA4 Measurement ID in the Google Analytics field
  - **Capture:** In Squarespace, Settings → Developer tools → External API keys. Capture the Google Analytics field with a placeholder G-XXXXXXXXXX ID.

## How to add Google Analytics 4 to a Webflow site

Page: `/guides/add-google-analytics-to-webflow`

- [ ] `webflow-google-analytics` → `public/content/webflow-google-analytics.webp`
  - **Shows:** Webflow's Site settings, Integrations, with a GA4 Measurement ID in the Google Analytics field
  - **Capture:** In Webflow, Site settings → Integrations → Google Analytics. Capture the field with a placeholder G-XXXXXXXXXX ID before saving.

## How to add Google Analytics 4 to your website

Page: `/guides/add-google-analytics-to-website`

- [ ] `ga4-create-property` → `public/content/ga4-create-property.webp`
  - **Shows:** Google Analytics' property setup: property name, reporting time zone and currency
  - **Capture:** In analytics.google.com, start creating a new property and capture the "Property details" step showing the name, reporting time zone and currency fields.

## How to add Google Analytics 4 to Wix

Page: `/guides/add-google-analytics-to-wix`

- [ ] `wix-google-analytics` → `public/content/wix-google-analytics.webp`
  - **Shows:** Wix Marketing Integrations with Google Analytics connected using a GA4 Measurement ID
  - **Capture:** In a Wix dashboard, Marketing & SEO → Marketing Integrations → Google Analytics. Capture the connect form with a placeholder G-XXXXXXXXXX ID.

## How to add Google Analytics 4 to WordPress

Page: `/guides/add-google-analytics-to-wordpress`

- [ ] `wordpress-site-kit` → `public/content/wordpress-site-kit.webp`
  - **Shows:** Site Kit by Google's setup screen in WordPress, connecting Google Analytics
  - **Capture:** On a WordPress test site, install Site Kit by Google and capture the setup step where you connect Analytics (choosing a GA4 property).

## How to add Google Analytics 4 with Google Tag Manager

Page: `/guides/add-google-analytics-with-google-tag-manager`

- [ ] `gtm-google-tag` → `public/content/gtm-google-tag.webp`
  - **Shows:** Google Tag Manager's tag editor: a Google Tag with a G- Tag ID, firing on Initialization – All Pages
  - **Capture:** In Google Tag Manager, create a Google Tag with a placeholder G-XXXXXXXXXX ID and the Initialization – All Pages trigger. Capture the tag editor before saving.

## How to add and verify your site in Google Search Console

Page: `/guides/add-site-to-search-console`

- [ ] `search-console-add-property` → `public/content/search-console-add-property.webp`
  - **Shows:** Search Console's 'Select property type' dialog with Domain and URL prefix options
  - **Capture:** In Google Search Console, choose Add property and capture the "Select property type" dialog with the Domain and URL prefix options. Use an example domain.

## How to exclude your own visits from Google Analytics 4

Page: `/guides/exclude-internal-traffic-ga4`

- [ ] `ga4-internal-traffic-filter` → `public/content/ga4-internal-traffic-filter.webp`
  - **Shows:** GA4's Data filters with the Internal Traffic filter set to Active
  - **Capture:** In GA4, Admin → Data filters → Internal Traffic. Capture the filter's settings with the "Active" filter state selected.

## GA4 data retention: what it is and what to set

Page: `/guides/ga4-data-retention`

- [ ] `ga4-data-retention` → `public/content/ga4-data-retention.webp`
  - **Shows:** GA4's Data retention settings with event data retention set to 14 months
  - **Capture:** In GA4, Admin → Data retention. Capture the settings with "14 months" selected for event data retention.

## What are key events in GA4, and how to mark one

Page: `/guides/ga4-key-events`

- [ ] `ga4-mark-key-event` → `public/content/ga4-mark-key-event.webp`
  - **Shows:** GA4's Events list in Admin, with the 'Mark as key event' switch turned on for sign_up
  - **Capture:** In GA4, open Admin → Data display → Events on a property that has a sign_up (or similar) event. Capture the list with the "Mark as key event" column, the switch on for sign_up.

## Why Stripe gets the credit for your sales in GA4, and how to fix it

Page: `/guides/ga4-unwanted-referrals-stripe`

- [ ] `ga4-unwanted-referrals` → `public/content/ga4-unwanted-referrals.webp`
  - **Shows:** GA4's 'List unwanted referrals' settings with a 'Referral domain contains checkout.stripe.com' condition
  - **Capture:** In GA4: Admin → Data streams → web stream → Configure tag settings → List unwanted referrals. Add "Referral domain contains" checkout.stripe.com (and paypal.com) and capture the screen before saving.

## How to find searches you're almost on page 1 for

Page: `/guides/keywords-close-to-page-1`

- [ ] `search-console-position-filter` → `public/content/search-console-position-filter.webp`
  - **Shows:** Search Console's queries table filtered to average position between 7.5 and 15.5, sorted by impressions
  - **Capture:** In Search Console's Performance report, add the two position filters on the Queries table and sort by impressions. Capture the table (blur queries if they're private).

## How to share your website stats publicly

Page: `/guides/public-analytics-page`

- [ ] `public-stats-page` → `public/content/public-stats-page.webp`
  - **Shows:** A SimpleDash public stats page showing visitors, the chart, top sources and pages
  - **Capture:** Open a real public page (yours, at simpledash.app/p/…) on desktop and capture the top of the page: the site name, date menu, numbers, chart and first cards.

## How to create a read-only restricted key in Stripe

Page: `/guides/stripe-restricted-key`

- [ ] `stripe-restricted-key-permissions` → `public/content/stripe-restricted-key-permissions.webp`
  - **Shows:** Stripe's restricted key form with Charges, Refunds, Customers and Subscriptions set to Read
  - **Capture:** In the Stripe Dashboard (a sandbox is fine), Developers → API keys → Create secret key → custom permissions. Name it SimpleDash, set Charges, Refunds, Customers and Subscriptions to Read, and capture the permissions list. Don't show a real key.

## How to track signups in Google Analytics 4

Page: `/guides/track-signups-ga4`

- [ ] `ga4-create-event-signup` → `public/content/ga4-create-event-signup.webp`
  - **Shows:** GA4's Create event form: a sign_up event made from page_view where page_location contains /welcome
  - **Capture:** In GA4, Admin → Data display → Events → Create event → Create. Fill in the custom event name sign_up and the two conditions (event_name equals page_view, page_location contains /welcome) and capture the form before saving.
