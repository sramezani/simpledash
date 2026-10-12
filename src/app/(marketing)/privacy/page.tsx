import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { legal } from "@/config/legal";
import { brand } from "@/config/theme";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What SimpleDash stores, what it reads from Google Analytics (read-only), who processes it, and how to delete it.",
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
            Your settings: the site you picked, your signup event, the weekly email switch and your
            public page choices.
          </li>
          <li>
            Your Google access tokens, encrypted, so we can read your reports when you aren&apos;t
            signed in (for the weekly email).
          </li>
          <li>Chart notes you write.</li>
          <li>
            Short-lived report caches: aggregated numbers such as total visitors, top pages and top
            countries. They are deleted after 7 days without use.
          </li>
          <li>
            Your billing status (trial, plan and renewal date). Card details stay with Stripe.
          </li>
        </ul>
        <p>
          We never store visitor-level data: no IP addresses, no visitor IDs, no individual visits.
          {` ${brand.name}`} has no tracking script of its own.
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

      <LegalSection title="Your public page">
        <p>
          A public page is off until you turn it on. When it&apos;s on, anyone with the link can see
          the cards you chose. It never shows your notes, email address, name or property ID. You
          can turn it off at any time.
        </p>
      </LegalSection>

      <LegalSection title="Who processes data for us">
        <ul>
          <li>Hetzner (Germany): the server that runs {brand.name}.</li>
          <li>Supabase (EU): the database.</li>
          <li>Cloudflare: DNS, network protection, caching and email forwarding.</li>
          <li>Resend: sends the weekly email.</li>
          <li>
            Stripe: payments. Stripe is the merchant of record, so it sells the subscription to you
            and handles tax under its own privacy policy.
          </li>
          <li>Sentry: error reports from our server. They don&apos;t include your Google data.</li>
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
          We only use the cookies needed to keep you signed in and to finish the Google sign-in
          safely. There are no analytics or advertising cookies, so there is no cookie banner.
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
          from flag-icons (MIT).
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
