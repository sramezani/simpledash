import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/states";
import { LiveButton } from "@/components/globe/live-button";
import { PausedView, PublicView } from "@/components/public-page/public-view";
import { defaultPublicCardIds, publicCardIds } from "@/config/cards";
import { uiKitEnabled } from "@/lib/env";
import { comparisonGap, parseRange,
  rangeForPlan, rangeWindow } from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { sampleLive, sampleReports, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";

export const metadata: Metadata = {
  title: "Public page preview",
  robots: { index: false, follow: false },
};

const STATES = ["default-cards", "all-cards", "free", "paused"] as const;

/** Dev only: a public stats page on sample data, without a real page in the database. */
export default function PublicPreviewPage({ searchParams }: PageProps<"/ui-kit/public">) {
  if (!uiKitEnabled) notFound();
  return (
    <Suspense fallback={<DashboardSkeleton header={false} />}>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/public">, "searchParams">) {
  await connection(); // dates depend on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "default-cards";
  const { range } = rangeForPlan(parseRange(params.range), state !== "free", "Europe/Amsterdam");
  const window = rangeWindow(range, "Europe/Amsterdam");
  const cards = state === "all-cards" ? publicCardIds : defaultPublicCardIds;
  return (
    <>
      <nav
        aria-label="Preview states"
        className="flex flex-wrap gap-1 border-b bg-muted px-4 py-2 text-xs"
      >
        {STATES.map((s) => (
          <Link
            key={s}
            href={{ pathname: "/ui-kit/public", query: { state: s, range } }}
            aria-current={s === state ? "page" : undefined}
            className="rounded-md px-2 py-1 aria-[current=page]:bg-card aria-[current=page]:font-medium"
          >
            {s}
          </Link>
        ))}
      </nav>
      {state === "paused" ? (
        <PausedView label="yoursite.com" />
      ) : (
        <PublicView
          basePath="/ui-kit/public"
          query={{ state }}
          live={
            <LiveButton
              endpoint={null}
              sample={sampleLive}
              siteName="yoursite.com"
              signupEvent={SAMPLE_SIGNUP_EVENT}
            />
          }
          view={{
            kind: "live",
            label: "yoursite.com",
            slug: "yoursite-com",
            cards: [...cards],
            indexable: true,
            range,
            window,
            reports: sampleReports(window, REPORTS),
            signupEvent: cards.includes("signups") ? SAMPLE_SIGNUP_EVENT : null,
            comparisonGap: comparisonGap(window, null),
            customLimited: false,
            // "free": a Free owner's page, with "Powered by" and the menu stopping at 30 days.
            poweredBy: state === "free",
            fullHistory: state !== "free",
          }}
        />
      )}
    </>
  );
}
