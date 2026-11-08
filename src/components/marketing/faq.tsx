import { ChevronDownIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { FREE_HISTORY_DAYS, plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { formatPrice } from "@/lib/format";

const items: { q: string; a: ReactNode }[] = [
  {
    q: "What is SimpleDash?",
    a: (
      <>
        A simple dashboard for Google Analytics 4 (GA4). You sign in with Google, and SimpleDash
        shows your visitors, where they came from, your top pages and your signups on one page, in
        plain words, for all your sites. It reads the data GA4 already has, so there is nothing to
        install and nothing to build.
      </>
    ),
  },
  {
    q: "Is SimpleDash a Google Analytics alternative?",
    a: (
      <>
        Not quite: it&apos;s a simpler way to read the Google Analytics you already have. GA4 keeps
        collecting the data, and SimpleDash shows the few numbers that matter. If you want to stop
        using Google altogether, a tool with its own script fits better, and our{" "}
        <Link href={"/compare" as Route}>comparisons</Link> say which.
      </>
    ),
  },
  {
    q: "Do I need GA4?",
    a: (
      <>
        Yes. SimpleDash reads the Google Analytics 4 data your site already collects, so it needs
        GA4 on your site. If you don&apos;t have it yet, sign in anyway: you&apos;ll see sample data
        and a 5-minute guide to add GA4.
      </>
    ),
  },
  {
    q: "What do you store?",
    a: (
      <>
        As little as possible: your account and settings, your Google access (encrypted), your chart
        notes, your public page settings, and short-lived summaries of your reports. Never data
        about individual visitors. Details are in the <Link href="/privacy">privacy policy</Link>.
      </>
    ),
  },
  {
    q: "Can SimpleDash change anything in my Google account?",
    a: "No. We only ask for read-only access to Google Analytics. You can remove it at any time in your Google account.",
  },
  {
    q: "Is it really free?",
    a: `Yes. ${plans.free.name} is all your sites and the last ${FREE_HISTORY_DAYS} days, with no card and no time limit. ${plans.pro.name} is ${formatPrice(plans.pro.prices.month)} a month and adds 12 months and any dates, the Monday email, Google search insights and revenue from Stripe.`,
  },
  {
    q: "Is SimpleDash open source?",
    a: (
      <>
        Yes. The code is on <a href={brand.sourceUrl}>GitHub</a> under the AGPL-3.0 license, so you
        can see exactly what it reads and stores.
      </>
    ),
  },
  {
    q: "GA4 has its own dashboard now. Why use SimpleDash?",
    a: (
      <>
        GA4&apos;s dashboard is a blank canvas: you pick every chart and need Editor access.
        SimpleDash is ready the moment you sign in, uses plain words instead of GA4&apos;s, and
        switches between all your sites in one click. See{" "}
        <Link href={"/guides/ga4-built-in-dashboard" as Route}>GA4&apos;s built-in dashboard</Link>.
      </>
    ),
  },
  {
    q: "Can I see all my GA4 sites in one place?",
    a: `Yes. ${plans.free.name} already includes every GA4 site your Google account can see, with no limit, and you switch between them in one click.`,
  },
  {
    q: "Can I get a weekly Google Analytics report by email?",
    a: `Yes, with ${plans.pro.name}. The Monday email brings last week's visitors, page views, signups, top sources and top pages for each of your sites, with the change from the week before.`,
  },
  {
    q: "How is it different from a Looker Studio template?",
    a: (
      <>
        A Looker Studio template is a report you copy, connect and fix when it breaks. SimpleDash
        has nothing to set up and loads from a cache, so it opens fast. More in{" "}
        <Link href={"/compare/simpledash-vs-looker-studio" as Route}>
          SimpleDash vs Looker Studio
        </Link>
        .
      </>
    ),
  },
  {
    q: "Can I share my Google Analytics stats publicly?",
    a: (
      <>
        Yes, on {plans.free.name}. Turn on a public stats page and pick which cards it shows; nobody
        needs access to your Google account. See{" "}
        <Link href={"/guides/public-analytics-page" as Route}>
          how to share your stats publicly
        </Link>
        .
      </>
    ),
  },
  {
    q: "Do I have to add a tracking script?",
    a: "No. SimpleDash has no script of its own. Your pages stay exactly as fast as they are.",
  },
];

/** FAQ, as native disclosure widgets: no JavaScript. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-4 py-16 sm:py-20">
      <Container className="flex max-w-3xl flex-col gap-6">
        <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">
          Questions about SimpleDash and GA4
        </h2>
        <div className="flex flex-col divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <details
              key={item.q}
              className="group px-5 py-4 [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDownIcon
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="pt-3 text-sm text-pretty text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
