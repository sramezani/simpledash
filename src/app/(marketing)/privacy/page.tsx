import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { CookieSettingsButton } from "@/components/shared/consent";
import { legal } from "@/config/legal";
import { plans } from "@/config/plans";
import { brand } from "@/config/theme";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What SimpleDash stores, what it reads from Google Analytics and Search Console (read-only), who processes it, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const email = legal.contactEmail;
  return (
    <LegalPage
      title="Privacy policy"
      intro={`${brand.name} shows the Google Analytics data you already have on one simple page. We store as little as possible, and we never store data about your visitors.`}
    >
      <LegalSection title="Who we are">
        <p>
          {brand.name} ({brand.url.replace("https://", "")}) is run by {legal.businessName},{" "}
          {legal.address}, {legal.country}. We are the controller of your account data. Questions:{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <ul>
          <li>Your account: your name, email address and profile picture from Google.</li>
          <li>
            Your sign-in sessions: when each one expires and which browser it belongs to. No IP
            addresses.
          </li>
          <li>
            Your settings: the sites you added, each site&apos;s signup event, public page choices,
            Search Console property and name spellings, and the weekly email switch.
          </li>
          <li>
            Your Google access tokens, encrypted, so we can read your reports when you aren&apos;t
            signed in (for the weekly email).
          </li>
          <li>Chart notes you write.</li>
          <li>
            Short-lived report caches: aggregated numbers such as total visitors, top pages and top
            countries, and, if you connect Search Console, totals and the top searches and pages
            from it. They are deleted after 7 days without use.
          </li>
          <li>Your billing status (plan and renewal date). Card details stay with Stripe.</li>
          <li>
            If you connect your own Stripe account ({plans.pro.name}): the restricted read-only key
            you paste, encrypted, and daily totals per site: money charged, refunds, the number of
            new customers and monthly recurring revenue. Never your customers&apos; names, emails,
            card details or IDs. Removing Stripe in Settings deletes the key and the totals.
          </li>
        </ul>
        <p>
          We never store visitor-level data: no IP addresses, no visitor IDs, no individual visits.
          {` ${brand.name}`} has no tracking script of its own.
        </p>
        <p>
          {brand.name} is open source, so you can check this list against the code: every table the
          app stores is in{" "}
          <a href={`${brand.sourceUrl}/blob/main/src/lib/db/schema.ts`}>one file</a>.
        </p>
      </LegalSection>

      <LegalSection title="What we read from Google, and why">
        <ul>
          <li>
            <strong>Basic profile</strong> (name, email, picture), to sign you in.
          </li>
          <li>
            <strong>Google Analytics, read-only</strong> (the <code>analytics.readonly</code>{" "}
            scope), to list your properties and fetch the reports shown on your dashboard, in the
            weekly email and, if you turn it on, on your public page. We can&apos;t change anything
            in your Google account.
          </li>
          <li>
            <strong>Search Console, read-only</strong> (the <code>webmasters.readonly</code> scope),
            only if you connect it on {plans.pro.name}: to list your Search Console properties and
            fetch the search reports shown in the Google search card. It is asked for only when you
            connect it, and we can&apos;t change anything in Search Console.
          </li>
        </ul>
        <p>
          {brand.name}&apos;s use and transfer to any other app of information received from Google
          APIs will adhere to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. In particular, we use Google data only to
          provide the features you see; we don&apos;t sell it, use it for ads or to train AI models,
          and no person reads it unless you ask us to for support, it&apos;s needed for security, or
          the law requires it.
        </p>
      </LegalSection>

      <LegalSection id="analytics" title="How we count visits to simpledash.app">
        <p>
          If you accept cookies in the banner, {brand.name} uses Google Analytics 4 on all of
          simpledash.app (the website, the dashboard and public stats pages) to count visits. If you
          decline, Google Analytics isn&apos;t loaded at all, and nothing is sent to Google.
        </p>
        <ul>
          <li>
            <strong>What it records:</strong> the pages you open, where you came from, your browser
            and device type, and your approximate location (city or country). Google uses your IP
            address to work out the location and doesn&apos;t store it. It also notes four moments:
            signing up, signing in, starting a checkout and buying {plans.pro.name}, with the plan
            and price but never your name, email or account.
          </li>
          <li>
            <strong>Cookies:</strong> <code>_ga</code> and <code>_ga_…</code>, which tell your
            visits apart, kept for up to 13 months.
          </li>
          <li>
            <strong>What we do with it:</strong> we look at the totals to see what people use and
            improve {brand.name}. No ads, no Google signals or ad personalisation, nothing sold, and
            nothing linked to your account.
          </li>
          <li>
            <strong>Google</strong> processes this for us and may do so in the United States, under
            the EU–US Data Privacy Framework.
          </li>
          <li>
            Your choice is kept in your browser. Change it any time:{" "}
            <CookieSettingsButton className="font-medium text-primary underline-offset-2 hover:underline" />
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Your own Stripe account">
        <p>
          On {plans.pro.name} you can paste a restricted Stripe key with read access, to see revenue
          next to your visitors. {brand.name} uses it only to read charges, refunds, customers&apos;
          creation dates and subscription prices, adds them up per day, and keeps only those totals.
          It can&apos;t change anything in your Stripe account, and we refuse keys that could.
        </p>
      </LegalSection>

      <LegalSection title="Your public page">
        <p>
          A public page is off until you turn it on. When it&apos;s on, anyone with the link can see
          the cards you chose. It never shows your notes, email address, name or property ID. You
          can turn it off at any time. Its visitors get the same analytics choice as everyone on
          simpledash.app (above): if they allow it, their visit is counted in {brand.name}&apos;s
          own Google Analytics, not in yours.
        </p>
      </LegalSection>

      <LegalSection title="Who processes data for us">
        <ul>
          <li>Microsoft Azure: the server that runs {brand.name} and its database.</li>
          <li>
            Cloudflare: DNS, network protection, caching, email forwarding, and storage for the
            nightly database backups.
          </li>
          <li>Resend: sends the weekly email.</li>
          <li>
            Stripe: payments. Stripe is the merchant of record, so it sells the subscription to you
            and handles tax under its own privacy policy.
          </li>
          <li>Sentry: error reports from our server. They don&apos;t include your Google data.</li>
          <li>Google: Google Analytics, only if you allow it (above).</li>
        </ul>
      </LegalSection>

      <LegalSection title="How long we keep it, and how to delete it">
        <ul>
          <li>
            <strong>Delete account</strong> (in Settings) removes your account and everything in it
            right away, cancels any subscription and revokes our Google access.
          </li>
          <li>
            <strong>Disconnect Google</strong> revokes our access and deletes the stored tokens and
            cached reports. Your settings and notes stay, so signing in again restores them.
          </li>
          <li>Report caches are deleted after 7 days without use.</li>
          <li>Database backups are kept for 30 days, then deleted.</li>
          <li>
            You can also remove our access from your Google account at any time
            (myaccount.google.com → Security → Third-party apps).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Two kinds, and no advertising cookies at all. The cookies needed to keep you signed in and
          to finish the Google sign-in safely are always used. Google Analytics&apos; cookies are
          set only if you allow them (above);{" "}
          <CookieSettingsButton className="font-medium text-primary underline-offset-2 hover:underline" />{" "}
          lets you change that.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask to see, correct, export or delete your data, or object to how we use it. Email{" "}
          <a href={`mailto:${email}`}>{email}</a>. If you&apos;re in the EU or UK, you can also
          complain to your data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="Credits">
        <p>
          The live globe places visitors using city data from{" "}
          <a href="https://www.geonames.org/">GeoNames</a>, licensed under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Country flags come
          from country-flag-icons (MIT).
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If we change this policy, we update the date at the top. For important changes, we email
          you first.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
