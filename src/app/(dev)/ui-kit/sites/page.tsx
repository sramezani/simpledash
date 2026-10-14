import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddSiteCard } from "@/components/dashboard/add-site-card";
import { SiteCard, SiteCardSkeleton } from "@/components/dashboard/site-card";
import { SitesView } from "@/components/dashboard/sites-view";
import { DashboardSkeleton } from "@/components/dashboard/states";
import { UpgradePanel } from "@/components/dashboard/upgrade-panel";
import { uiKitEnabled } from "@/lib/env";
import { percentChange } from "@/lib/format";
import { rangeWindow } from "@/lib/ga4/ranges";
import { sampleReports } from "@/lib/ga4/sample/sample";

export const metadata: Metadata = {
  title: "All sites preview",
  robots: { index: false, follow: false },
};

const STATES = ["pro", "full", "free", "loading"] as const;

async function noop() {
  "use server";
}

async function noProperties() {
  "use server";
  return { error: "This is a preview: no Google account to list." };
}

async function noPick() {
  "use server";
  return { error: "This is a preview." };
}

/** Dev only: All sites (docs/SPEC.md section 28.1) on sample data. */
export default function SitesPreviewPage({ searchParams }: PageProps<"/ui-kit/sites">) {
  if (!uiKitEnabled) notFound();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

const SITES = [
  { label: "yoursite.com", scale: 1, problem: null },
  { label: "blog.yoursite.com", scale: 0.42, problem: null },
  { label: "docs.yoursite.com", scale: 0.18, problem: "Google access ended" },
  { label: "side-project.dev", scale: 0.07, problem: null },
];

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/sites">, "searchParams">) {
  await connection(); // dates depend on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "pro";
  const window = rangeWindow("7d", "Europe/Amsterdam");
  const r = sampleReports(window, ["totals", "series"]);
  const shown = state === "free" ? SITES.slice(0, 1) : SITES;
  const cards = shown.map((s, i) => {
    const visitors = Math.round(r.totals.data.current.visitors * s.scale);
    const before = Math.round(r.totals.data.previous.visitors * s.scale * (1 + (i % 3) * 0.2));
    const id = `00000000-0000-4000-8000-00000000000${i + 1}`;
    return state === "loading" ? (
      <SiteCardSkeleton key={id} label={s.label} domain={null} />
    ) : (
      <SiteCard
        key={id}
        site={{
          id,
          label: s.label,
          domain: null,
          current: i === 0,
          visitors,
          change: percentChange(visitors, before),
          missing: null,
          series: r.series.data.points.map((p) => Math.round(p.visitors * s.scale)),
          problem: s.problem,
        }}
      />
    );
  });
  return (
    <>
      <nav
        aria-label="Preview states"
        className="flex flex-wrap gap-1 border-b bg-muted px-4 py-2 text-xs"
      >
        {STATES.map((s) => (
          <Link
            key={s}
            href={{ pathname: "/ui-kit/sites", query: { state: s } }}
            aria-current={s === state ? "page" : undefined}
            className="rounded-md px-2 py-1 aria-[current=page]:bg-card aria-[current=page]:font-medium"
          >
            {s}
          </Link>
        ))}
      </nav>
      <SitesView
        basePath="/ui-kit/dashboard"
        upgrade={state === "free" ? <UpgradePanel feature="sites" upgrade={noop} /> : null}
        cards={cards}
        add={
          state === "pro" ? (
            <AddSiteCard
              listAction={noProperties}
              addAction={noPick}
              listedProperties={[]}
              used={SITES.length}
              limit={10}
            />
          ) : null
        }
      />
    </>
  );
}
