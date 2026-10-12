import type { Metadata } from "next";
import { DemoFrame } from "@/components/marketing/demo-frame";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Container } from "@/components/shared/container";
import { brand } from "@/config/theme";
import { env } from "@/lib/env";
import { jsonLd, softwareApplication } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: { absolute: `${brand.name}: ${brand.tagline}` },
  description: brand.description,
  alternates: { canonical: "/" },
};

/** The landing page (docs/SPEC.md section 17). Static; the live demo loads in its frame. */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <section aria-label="Live demo" className="pb-10 sm:pb-14">
          <Container>
            <DemoFrame />
          </Container>
        </section>
        <HowItWorks />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(softwareApplication(env.APP_URL)) }}
      />
    </>
  );
}
