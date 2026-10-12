import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/states";
import { PublicView } from "@/components/public-page/public-view";
import { Container } from "@/components/shared/container";
import { demo } from "@/config/demo";
import { plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { parseRange } from "@/lib/ga4/ranges";
import { getDemoView } from "@/lib/public-page/demo";

export const metadata: Metadata = {
  title: { absolute: `Live demo · ${brand.name}` },
  description: `A real public stats page made with ${brand.name}: visitors, sources and top pages from Google Analytics, on one page.`,
  alternates: { canonical: "/demo" },
  // The same page is a public stats page at /p/<slug>; that one is the original.
  robots: { index: false, follow: true },
};

/**
 * The live demo (docs/SPEC.md section 17): a real public stats page, shown in a
 * browser frame on the landing page (`?embed=1`) and on its own here.
 */
export default function DemoPage(props: PageProps<"/demo">) {
  return (
    <Suspense fallback={<DashboardSkeleton header={false} />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: PageProps<"/demo">) {
  await connection(); // the sample-data fallback depends on the current time
  const params = await searchParams;
  const range = parseRange(params.range, demo.defaultRange);
  const embedded = params.embed === "1";
  const view = await getDemoView(range);
  return (
    <>
      {embedded ? null : <DemoBanner />}
      <PublicView
        view={view}
        basePath="/demo"
        query={embedded ? { embed: "1" } : undefined}
        defaultRange={demo.defaultRange}
        embedded={embedded}
      />
    </>
  );
}

/** On its own, the demo says what it is and how to get one. */
function DemoBanner() {
  return (
    <div className="border-b bg-card">
      <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Live demo.</span> A real public stats page,
          made with {brand.name}.
        </p>
        <Link
          href="/signin"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 pointer-coarse:h-11"
        >
          Try it free for {plans.starter.trialDays} days
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </Container>
    </div>
  );
}
