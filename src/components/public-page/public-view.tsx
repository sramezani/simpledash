import Link from "next/link";
import type { Route } from "next";
import { AiCard } from "@/components/cards/ai-card";
import { CountriesCard } from "@/components/cards/countries-card";
import { DevicesCard } from "@/components/cards/devices-card";
import { PagesCard } from "@/components/cards/pages-card";
import { SourcesCard } from "@/components/cards/sources-card";
import { StatCard } from "@/components/cards/stat-card";
import { SummaryLine } from "@/components/cards/summary-line";
import { VisitorsCard } from "@/components/cards/visitors-card";
import { StaticLineChart } from "@/components/charts/static-line-chart";
import { LiveCard } from "@/components/globe/live-card";
import { Container } from "@/components/shared/container";
import { LogoMark } from "@/components/shared/logo";
import { SegmentedLinks } from "@/components/shared/segmented-links";
import { brand } from "@/config/theme";
import { chartCaption, chartPoints } from "@/lib/charts/series";
import { formatDayRange, formatDuration, formatMonth, formatNumber } from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import { PREVIOUS_PERIOD_WORDS, RANGE_LABELS, RANGE_TYPES } from "@/lib/ga4/ranges";
import type { PublicView as View } from "@/lib/public-page/view";
import { buildSummary } from "@/lib/summary/summary";

type LiveViewData = Extract<View, { kind: "live" }>;

/** The public stats page body (docs/SPEC.md section 15): the chosen cards, no chart JavaScript. */
export function PublicView({
  view,
  basePath = `/p/${view.slug}`,
  live,
}: {
  view: LiveViewData;
  /** Where the date switch links to (the dev preview passes its own path). */
  basePath?: string;
  /** Replaces the "Right now" card, e.g. with sample data in the dev preview. */
  live?: React.ReactNode;
}) {
  const { cards, reports, window, range, signupEvent, comparable } = view;
  const has = (id: string) => (cards as string[]).includes(id);
  const totals = reports.totals?.data ?? null;
  const stats = deriveStats(totals, reports.actions?.data ?? null, signupEvent, comparable);
  const series = reports.series?.data ?? null;
  const points = series
    ? chartPoints(series.points, series.granularity, window.includesYesterday)
    : null;
  const period =
    window.granularity === "yearMonth"
      ? `${formatMonth(window.current.start)} – ${formatMonth(window.current.end)}`
      : formatDayRange(window.current.start, window.current.end);
  const versus = `vs ${PREVIOUS_PERIOD_WORDS[range]}`;
  const missing = comparable ? undefined : "Not enough history to compare";
  const statCards = (
    [
      [
        "visitors",
        stats ? formatNumber(stats.visitors.value ?? 0) : null,
        stats?.visitors.change ?? null,
      ],
      [
        "page-views",
        stats ? formatNumber(stats.pageViews.value ?? 0) : null,
        stats?.pageViews.change ?? null,
      ],
      [
        "avg-time",
        stats?.avgTime.value != null ? formatDuration(stats.avgTime.value) : null,
        stats?.avgTime.change ?? null,
      ],
      [
        "signups",
        stats?.signups?.value != null ? formatNumber(stats.signups.value) : null,
        stats?.signups?.change ?? null,
      ],
    ] as const
  ).filter(([id]) => has(id) && (id !== "signups" || signupEvent));
  const lists = ["sources", "pages", "countries", "devices", "ai"].filter(has);

  return (
    <>
      <header className="border-b bg-background">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight">{view.label}</h1>
            <p className="text-sm text-muted-foreground">Live stats · {period}</p>
          </div>
          <SegmentedLinks
            label="Date range"
            items={RANGE_TYPES.map((r) => ({
              label: RANGE_LABELS[r],
              href: (r === "7d" ? basePath : `${basePath}?range=${r}`) as Route,
              active: r === range,
            }))}
          />
        </Container>
      </header>
      <main id="main" className="pb-12">
        <Container className="flex flex-col gap-4 pt-4">
          {has("summary") ? (
            <SummaryLine
              text={buildSummary({
                range,
                totals,
                sources: reports.sources?.data ?? null,
                actions: reports.actions?.data ?? null,
                signupEvent,
                comparable,
              })}
            />
          ) : null}
          {statCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {statCards.map(([id, value, change]) => (
                <StatCard
                  key={id}
                  id={id}
                  value={value}
                  change={change}
                  versus={versus}
                  missing={missing}
                />
              ))}
            </div>
          ) : null}
          {has("chart") && points ? (
            <VisitorsCard
              points={points}
              caption={chartCaption(points, window.granularity, period)}
              chart={<StaticLineChart points={points} />}
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
                />
              ) : null}
              {has("pages") ? (
                <PagesCard
                  pages={reports.pages?.data ?? null}
                  landing={reports.landing?.data ?? null}
                />
              ) : null}
              {has("countries") ? (
                <CountriesCard
                  countries={reports.countries?.data ?? null}
                  total={totals?.current.visitors ?? null}
                />
              ) : null}
              {has("devices") ? <DevicesCard devices={reports.devices?.data ?? null} /> : null}
              {has("ai") ? (
                <AiCard
                  sources={reports.ai_sources?.data ?? null}
                  pages={reports.ai_pages?.data ?? null}
                />
              ) : null}
            </div>
          ) : null}
        </Container>
      </main>
      <PoweredBy />
    </>
  );
}

/** The "Powered by SimpleDash" link on every public page. */
export function PoweredBy() {
  return (
    <footer className="border-t">
      <Container className="flex justify-center py-6">
        <Link
          href={brand.url as Route}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground"
        >
          <LogoMark className="size-5 text-brand" />
          Powered by {brand.name}
        </Link>
      </Container>
    </footer>
  );
}

/** "This page is paused." Shown when the owner's plan is locked or Google access ended. */
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
