import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { legal, operator } from "@/config/legal";
import { FREE_HISTORY_DAYS, plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { priceInWords } from "@/lib/billing/prices";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Terms",
  description: `The terms for using ${brand.name}: Free and Pro, prices, billing through Stripe, cancelling and refunds.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const { free, pro } = plans;
  const email = legal.contactEmail;
  return (
    <LegalPage
      title="Terms"
      intro={`These terms are the agreement between you and ${operator()} ("we") for using ${brand.name}. They're written in plain English; please read them. By creating an account or using ${brand.name}, you agree to them.`}
    >
      <LegalSection title="The service">
        <p>
          {brand.name} reads your Google Analytics 4 data with read-only access and shows it on a
          dashboard, in a weekly email and, if you turn it on, on a public page. The numbers come
          from Google. We show them as Google reports them and can&apos;t promise they&apos;re
          complete: for example, visitors who block Google Analytics aren&apos;t counted.
        </p>
        <p>
          You sign in with Google. Only connect Google Analytics properties you&apos;re allowed to
          view, and keep your Google account secure. You must be at least 16, and if you use{" "}
          {brand.name} for a business, you confirm you may accept these terms for it.
        </p>
      </LegalSection>

      <LegalSection title="Information, not advice">
        <p>
          Everything {brand.name} shows (numbers, changes, the lines about what brings customers,
          the weekly Google search page and its steps) is information worked out from Google&apos;s
          and Stripe&apos;s data. It isn&apos;t business, financial, marketing, legal or tax advice,
          and it never says why something happened. You decide what to do with it, and you&apos;re
          responsible for those decisions.
        </p>
      </LegalSection>

      <LegalSection title="Google, Stripe and other services">
        <p>
          {brand.name} works with services you have your own accounts for: Google Analytics, Google
          Search Console and, if you connect it, Stripe. Their terms apply to your use of them. We
          don&apos;t control them, and we aren&apos;t responsible for their data, outages, changes,
          limits or charges. If one of them changes or stops its service, a feature that depends on
          it may change or stop too.
        </p>
      </LegalSection>

      <LegalSection title="Free">
        <p>
          New accounts are on {free.name}: all your sites, the last {FREE_HISTORY_DAYS} days and
          public pages, with no card and no time limit. We may change what {free.name} includes; if
          we do, we&apos;ll tell you by email at least 30 days before.
        </p>
      </LegalSection>

      <LegalSection title="Prices and billing">
        <ul>
          <li>
            The {pro.name} plan costs {priceInWords("month")} or {priceInWords("year")}, and adds 12
            months and any dates, the Monday email, Google search insights and revenue from Stripe.
            Prices include tax.
          </li>
          <li>
            Launch price: if you subscribe at today&apos;s price, it stays the same for as long as
            your subscription runs without a break.
          </li>
          <li>
            You can switch between monthly and yearly in Settings → Plan &amp; billing. Stripe shows
            the exact amount for the rest of your period before you confirm. Going back to{" "}
            {free.name} keeps your sites and their settings; {pro.name}&apos;s extras stop until you
            upgrade again.
          </li>
          <li>
            Payments are handled by Stripe, which acts as the merchant of record: Stripe sells the
            subscription to you, charges your card and handles sales tax and VAT.
          </li>
          <li>
            Subscriptions renew automatically at the end of each month or year until you cancel.
            Apart from the launch price above, we tell you before any price change, and it applies
            from your next renewal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cancelling and refunds">
        <ul>
          <li>
            You can cancel at any time in Settings → Plan &amp; billing. Your plan stays active
            until the end of the period you paid for, and it doesn&apos;t renew.
          </li>
          <li>Monthly payments aren&apos;t refunded for part of a month.</li>
          <li>
            Yearly payments are refunded in full if you ask within {legal.yearlyRefundDays} days of
            the payment. After that, cancelling stops the next renewal.
          </li>
          <li>
            To ask for a refund, email <a href={`mailto:${email}`}>{email}</a>. Your legal rights as
            a consumer, where they apply, are not affected.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>Please don&apos;t:</p>
        <ul>
          <li>use {brand.name} for anything illegal, or for data you have no right to see;</li>
          <li>try to break, overload, scrape or reverse-engineer the service;</li>
          <li>publish a public page that misleads people about where the numbers come from;</li>
          <li>connect a Stripe key or a Google account that isn&apos;t yours to use.</li>
        </ul>
        <p>We may suspend or close accounts that break these rules, and we&apos;ll tell you why.</p>
      </LegalSection>

      <LegalSection title="Your public pages">
        <p>
          A public page shows the numbers you choose to anyone with the link. You decide whether to
          turn it on and what it shows, and you&apos;re responsible for that, including whether
          you&apos;re allowed to share those numbers.
        </p>
      </LegalSection>

      <LegalSection title="If someone makes a claim because of your use">
        <p>
          As far as the law allows, you agree to cover us for claims, losses and reasonable costs
          that come from you breaking these terms, from data you connected without the right to, or
          from what you publish on a public page. This doesn&apos;t apply to the extent we caused
          the problem.
        </p>
      </LegalSection>

      <LegalSection title="Your data">
        <p>
          Your data stays yours. We use it only to run {brand.name}, as described in the{" "}
          <Link href="/privacy">privacy policy</Link>. You can delete your account and all its data
          at any time in Settings.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          We work to keep {brand.name} running and fast, but it depends on Google&apos;s and
          Stripe&apos;s services and we can&apos;t promise it will always be available, error-free
          or uninterrupted. We may improve, change or remove features over time; if we remove a paid
          feature you rely on, you can cancel and we&apos;ll refund the unused part of a yearly
          payment.
        </p>
        <p>
          We aren&apos;t responsible for delays or failures caused by things outside our reasonable
          control, such as outages of Google, Stripe or our hosting, internet failures, attacks or
          changes in the law.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <ul>
          <li>
            {brand.name} is provided &quot;as is&quot; and &quot;as available&quot;. As far as the
            law allows, we give no promises beyond these terms, including that the numbers are
            complete, accurate or fit for a particular purpose.
          </li>
          <li>
            As far as the law allows, we aren&apos;t liable for indirect or consequential losses,
            such as lost profits, revenue, data, goodwill or business opportunities, or losses from
            decisions made using {brand.name}.
          </li>
          <li>
            As far as the law allows, our total liability for everything to do with {brand.name} is
            limited to what you paid us in the 12 months before the claim, or{" "}
            {formatPrice(legal.minimumLiability)} if you paid nothing.
          </li>
          <li>
            Any claim must be made within one year of the event it&apos;s about, where the law
            allows such a limit.
          </li>
          <li>
            Nothing in these terms limits liability that can&apos;t be limited by law, such as for
            fraud, deliberate misconduct or gross negligence, or your rights as a consumer.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Ending the agreement">
        <p>
          You can stop at any time by deleting your account in Settings. We may end the service or
          your account with 30 days&apos; notice by email, or straight away if you seriously break
          these terms. If we end it without you breaking them, we refund the unused part of a yearly
          payment.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If we change these terms, we update the date at the top and email you about important
          changes at least 14 days before they apply.
        </p>
      </LegalSection>

      <LegalSection title="General">
        <p>
          These terms and the <Link href="/privacy">privacy policy</Link> are the whole agreement
          between us about {brand.name}. If part of them can&apos;t be enforced, the rest still
          applies. Not enforcing a part straight away doesn&apos;t mean we give it up. We may pass
          this agreement to a company that takes over {brand.name}, and we&apos;ll tell you if we
          do.
        </p>
      </LegalSection>

      <LegalSection title="Law and contact">
        <p>
          {legal.country
            ? `These terms are governed by the laws of ${legal.country}, and disputes go to the competent court${legal.address ? ` in ${legal.address}` : ""}, `
            : "These terms are governed by the laws of the country where we are established, and disputes go to its courts, "}
          unless the law of your country gives you the right to use your own courts and laws. Please
          email us first: most things can be sorted out quickly. Contact: {operator()},{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
