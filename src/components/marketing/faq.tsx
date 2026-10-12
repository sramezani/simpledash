import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { plans } from "@/config/plans";

const items: { q: string; a: ReactNode }[] = [
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
    q: "What happens after the free trial?",
    a: `After ${plans.starter.trialDays} days the dashboard locks until you subscribe. Nothing is deleted, and there's no card to cancel.`,
  },
  {
    q: "Do I have to add a tracking script?",
    a: "No. SimpleDash has no script of its own. Your pages stay exactly as fast as they are.",
  },
];

/** FAQ, as native disclosure widgets: no JavaScript. */
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="py-16 sm:py-20">
      <Container className="flex max-w-3xl flex-col gap-6">
        <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">
          Questions
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
