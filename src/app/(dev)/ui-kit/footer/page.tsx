import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/shared/container";
import { footer } from "@/config/footer";
import { uiKitEnabled } from "@/lib/env";
import { addDays, todayIn } from "@/lib/ga4/ranges";
import { sampleLive } from "@/lib/ga4/sample/sample";
import { tickerItems, type FooterStats } from "@/lib/public-page/footer-data";

export const metadata: Metadata = {
  title: "Footer preview",
  robots: { index: false, follow: false },
};

const STATES = {
  full: "Ten days and the live band",
  quiet: "Nobody there right now",
  "new-site": "A site younger than ten days",
  plain: "No numbers: the plain word",
} as const;
type State = keyof typeof STATES;

const SAMPLE_DAYS = [142, 168, 96, 88, 201, 236, 219, 254, 190, 131];

/** Dev only: the landing page's footer on sample numbers, in each of its states. */
export default function FooterPreviewPage({ searchParams }: PageProps<"/ui-kit/footer">) {
  if (!uiKitEnabled) notFound();
  return (
    <Suspense fallback={null}>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/footer">, "searchParams">) {
  await connection(); // the days end today
  const params = await searchParams;
  const state = (Object.keys(STATES) as State[]).find((s) => s === params.state) ?? "full";
  return (
    <>
      <main className="flex min-h-[110vh] flex-col py-12">
        <Container className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Footer preview</h1>
          <p className="text-muted-foreground">Sample numbers. Scroll down to see the bars rise.</p>
          <ul className="flex flex-wrap gap-2">
            {(Object.keys(STATES) as State[]).map((s) => (
              <li key={s}>
                <Link
                  href={`/ui-kit/footer?state=${s}` as Route}
                  aria-current={s === state ? "page" : undefined}
                  className="inline-flex h-8 items-center rounded-lg border px-3 text-sm aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
                >
                  {STATES[s]}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </main>
      <SiteFooter preview={sampleStats(state)} />
    </>
  );
}

function sampleStats(state: State): FooterStats | null {
  if (state === "plain") return null;
  const today = todayIn("Europe/Amsterdam");
  const days = SAMPLE_DAYS.map((visitors, i) => ({
    date: addDays(today, i - (SAMPLE_DAYS.length - 1)),
    visitors: state === "new-site" && i < 4 ? null : visitors,
    today: i === SAMPLE_DAYS.length - 1,
  }));
  const ticker =
    state === "quiet"
      ? []
      : tickerItems(sampleLive, { countries: true, pages: true, devices: true });
  return {
    label: "simpledash.app",
    slug: footer.slug,
    days,
    ticker,
    checkedAt: ticker.length > 0 ? new Date(Date.now() - 6 * 60_000).toISOString() : null,
  };
}
