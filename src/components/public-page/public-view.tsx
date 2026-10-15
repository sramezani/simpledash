import Link from "next/link";
import type { Route } from "next";
import { AiCard } from "@/components/cards/ai-card";
import { CountriesCard } from "@/components/cards/countries-card";
import { DevicesCard } from "@/components/cards/devices-card";
import { OverviewCard, type OverviewMetric } from "@/components/cards/overview-card";
import { PagesCard } from "@/components/cards/pages-card";
import { SourcesCard } from "@/components/cards/sources-card";
import { StaticLineChart } from "@/components/charts/static-line-chart";
import { LiveCard } from "@/components/globe/live-card";
import { Container } from "@/components/shared/container";
import { LogoMark } from "@/components/shared/logo";
import { Notice } from "@/components/shared/notice";
import { OverviewToolbar } from "@/components/shared/overview-toolbar";
import { SiteChip } from "@/components/shared/site-chip";
import { brand } from "@/config/theme";
import { chartCaption, chartPoints, periodLabel } from "@/lib/charts/series";
import { formatDuration, formatNumber } from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import {
  freshnessNote,
  isPreset,
  previousPeriodWords,
  freeFirstDay,
  rangeMenu,
  type RangeType,
} from "@/lib/ga4/ranges";
import type { PublicView as View } from "@/lib/public-page/view";

type LiveViewData = Extract<View, { kind: "live" }>;

/** The public stats page body (docs/SPEC.md section 15): the chosen cards, no chart JavaScript. */
export function PublicView({
  view,
  basePath = `/p/${view.slug}`,
  query,
  defaultRange,
  live,
  embedded = false,
}: {
  view: LiveViewData;
  /** Where the date menu links to (the demo and the dev preview pass their own path). */
  basePath?: string;
  /** Other search params the date menu keeps (dev preview). */
  query?: Record<string, string>;
  /** The range shown without `?range=` (the demo's differs). */
  defaultRange?: RangeType;
  /** Replaces the "Right now" card, e.g. with sample data in the dev preview. */
  live?: React.ReactNode;
  /** Shown inside the landing page's browser frame: links leave the frame. */
  embedded?: boolean;
}) {
  const { cards, reports, window, range, signupEvent, comparisonGap } = view;
  const has = (id: string) => (cards as string[]).includes(id);
  const comparable = comparisonGap === null;
  const totals = reports.totals?.data ?? null;
  const stats = deriveStats(totals, reports.actions?.data ?? null, signupEvent, comparable);
  const series = reports.series?.data ?? null;
  const points = series
    ? chartPoints(series.points, series.granularity, window.lastPointPending)
    : null;
  const period = periodLabel(window);
  const versus = `vs ${previousPeriodWords(range)}`;
  const exportInfo = { site: view.label, ...window.current };
  const metrics = (
    [
      {
        id: "visitors",
        value: stats ? formatNumber(stats.visitors.value ?? 0) : null,
        change: stats?.visitors.change ?? null,
      },
      {
        id: "page-views",
        value: stats ? formatNumber(stats.pageViews.value ?? 0) : null,
        change: stats?.pageViews.change ?? null,
      },
      {
        id: "avg-time",
        value: stats?.avgTime.value != null ? formatDuration(stats.avgTime.value) : null,
        change: stats?.avgTime.change ?? null,
      },
      {
        id: "signups",
        value: stats?.signups?.value != null ? formatNumber(stats.signups.value) : null,
        change: stats?.signups?.change ?? null,
      },
    ] satisfies OverviewMetric[]
  ).filter(({ id }) => has(id) && (id !== "signups" || signupEvent));
  const showChart = has("chart");
  const lists = ["sources", "pages", "countries", "devices", "ai"].filter(has);

  return (
    <>
      <main id="main" className="pb-12">
        <Container className="flex flex-col gap-4 pt-5 sm:pt-6">
          <OverviewToolbar
            site={<SiteChip as="h1" domain={view.label} label={view.label} />}
            menu={rangeMenu(
              range,
              window,
              basePath,
              query,
              defaultRange,
              view.fullHistory ? null : { firstDay: freeFirstDay(window.today) },
            )}
            period={isPreset(range) ? period : null}
            note={freshnessNote(window)}
          />
          {view.customLimited ? (
            <Notice tone="warning" title="This page can't load more custom ranges right now.">
              Try again in an hour, or pick a range from the menu.
            </Notice>
          ) : null}
          {metrics.length > 0 || showChart ? (
            <OverviewCard
              metrics={metrics}
              versus={versus}
              missing={comparisonGap ?? undefined}
              points={points}
              showChart={showChart}
              caption={points ? chartCaption(points, window.granularity, period) : ""}
              chart={points ? <StaticLineChart points={points} /> : null}
            />
          ) : null}
          {has("live")
            ? (live ?? <LiveCard data={null} deferred endpoint={`/api/p/${view.slug}/live`} />)
            : null}
          {lists.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {has("sources") ? (
                <SourcesCard
                  sources={reports.sources?.data ?? null}
                  channels={reports.channels?.data ?? null}
                  exportInfo={exportInfo}
                />
              ) : null}
              {has("pages") ? (
                <PagesCard
                  pages={reports.pages?.data ?? null}
                  landing={reports.landing?.data ?? null}
                  exportInfo={exportInfo}
                />
              ) : null}
              {has("countries") ? (
                <CountriesCard
                  countries={reports.countries?.data ?? null}
                  cities={reports.cities?.data ?? null}
                  total={totals?.current.visitors ?? null}
                  exportInfo={exportInfo}
                />
              ) : null}
              {has("devices") ? (
                <DevicesCard
                  browsers={reports.browsers?.data ?? null}
                  systems={reports.systems?.data ?? null}
                  devices={reports.devices?.data ?? null}
                  exportInfo={exportInfo}
                />
              ) : null}
              {has("ai") ? (
                <AiCard
                  sources={reports.ai_sources?.data ?? null}
                  pages={reports.ai_pages?.data ?? null}
                  exportInfo={exportInfo}
                />
              ) : null}
            </div>
          ) : null}
        </Container>
      </main>
      {view.poweredBy ? <PoweredBy embedded={embedded} /> : null}
    </>
  );
}

/** The "Powered by SimpleDash" link on Free owners' public pages. Inside the demo frame it opens the whole page. */
export function PoweredBy({ embedded = false }: { embedded?: boolean }) {
  return (
    <footer className="border-t">
      <Container className="flex justify-center py-6">
        <Link
          href={(embedded ? "/" : brand.url) as Route}
          target={embedded ? "_top" : undefined}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground"
        >
          <LogoMark className="size-5 text-brand" />
          Powered by {brand.name}
        </Link>
      </Container>
    </footer>
  );
}

/** "This page is paused." Shown when Google access to the site ended. */
export function PausedView({ label }: { label: string }) {
  return (
    <>
      <main id="main" className="flex min-h-[70dvh] items-center py-16">
        <Container className="flex max-w-lg flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-muted-foreground">This page is paused.</p>
        </Container>
      </main>
      <PoweredBy />
    </>
  );
}
