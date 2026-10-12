import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PausedView, PublicView } from "@/components/public-page/public-view";
import { DashboardSkeleton } from "@/components/dashboard/states";
import { brand } from "@/config/theme";
import { parseRange } from "@/lib/ga4/ranges";
import { getPublicView } from "@/lib/public-page/view";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const view = await getPublicView(slug, "7d");
  // Throwing here lets crawlers (which get blocking metadata) see a real 404 status.
  if (view.kind === "missing") notFound();
  const title = `${view.label} stats · ${brand.name}`;
  const indexable = view.kind === "live" && view.indexable;
  return {
    title: { absolute: title },
    description: `Live visitor stats for ${view.label}: visitors, sources and top pages, shared with ${brand.name}.`,
    alternates: { canonical: `/p/${slug}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, type: "website" },
  };
}

/** A public stats page, /p/<slug> (docs/SPEC.md section 15). */
export default function PublicPage(props: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<DashboardSkeleton header={false} />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const range = parseRange((await searchParams).range);
  const view = await getPublicView(slug, range);
  if (view.kind === "missing") notFound();
  if (view.kind === "paused") return <PausedView label={view.label} />;
  return <PublicView view={view} />;
}
