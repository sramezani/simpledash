import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { legal } from "@/config/legal";
import { plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { priceInWords } from "@/lib/billing/prices";

export const metadata: Metadata = {
  title: "Terms",
  description: `The terms for using ${brand.name}: the free trial, prices, billing through Stripe, cancelling and refunds.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const starter = plans.starter;
  const email = legal.contactEmail;
  return (
    <LegalPage
      title="Terms"
      intro={`These terms are the agreement between you and ${legal.businessName} for using ${brand.name}. They're written in plain English; please read them.`}
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
          view, and keep your Google account secure.
        </p>
      </LegalSection>

      <LegalSection title="The free trial">
        <p>
          New accounts get a {starter.trialDays}-day free trial with every feature. No card is
          needed. When the trial ends, the dashboard locks and the weekly email and public page
          pause until you subscribe. Your settings and notes are kept.
        </p>
      </LegalSection>

      <LegalSection title="Prices and billing">
        <ul>
          <li>
            The {starter.name} plan costs {priceInWords("month")} or {priceInWords("year")}. Prices
            include VAT.
          </li>
          <li>
            Payments are handled by Stripe, which acts as the merchant of record: Stripe sells the
            subscription to you, charges your card and handles sales tax and VAT.
          </li>
          <li>
            Subscriptions renew automatically at the end of each month or year until you cancel. We
            tell you before any price change, and it applies from your next renewal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cancelling and refunds">
        <ul>
          <li>
            You can cancel at any time in Settings → Billing. Your plan stays active until the end
            of the period you paid for, and it doesn&apos;t renew.
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
          <li>publish a public page that misleads people about where the numbers come from.</li>
        </ul>
        <p>We may suspend accounts that break these rules, and we&apos;ll tell you why.</p>
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
          We work to keep {brand.name} running and fast, but it depends on Google&apos;s APIs and we
          can&apos;t promise it will never be unavailable. We may improve or change features over
          time.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          {brand.name} is provided as it is. As far as the law allows, we aren&apos;t liable for
          indirect losses such as lost profits or decisions made from the numbers, and our total
          liability is limited to what you paid us in the 12 months before the claim. Nothing in
          these terms limits liability that can&apos;t be limited by law.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If we change these terms, we update the date at the top and email you about important
          changes at least 14 days before they apply.
        </p>
      </LegalSection>

      <LegalSection title="Law and contact">
        <p>
          These terms are governed by the laws of {legal.country}, and disputes go to its courts,
          unless the law of your country says otherwise. Contact: {legal.businessName},{" "}
          {legal.address}, {legal.country}, <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
