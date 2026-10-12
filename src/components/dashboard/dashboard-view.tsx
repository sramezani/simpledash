import type { ReactNode } from "react";
import { ActionsCard } from "@/components/cards/actions-card";
import { AiCard } from "@/components/cards/ai-card";
import { CountriesCard } from "@/components/cards/countries-card";
import { DevicesCard } from "@/components/cards/devices-card";
import { PagesCard } from "@/components/cards/pages-card";
import { SourcesCard } from "@/components/cards/sources-card";
import { StatCard } from "@/components/cards/stat-card";
import { SummaryLine } from "@/components/cards/summary-line";
import { VisitorsCard } from "@/components/cards/visitors-card";
import { VisitorsChartLazy } from "@/components/charts/visitors-chart-lazy";
import { Container } from "@/components/shared/container";
import { CsvLink } from "@/components/shared/csv-link";
import { cardById, type CardId } from "@/config/cards";
import { chartCaption, chartPoints, noteMarks } from "@/lib/charts/series";
import { formatDayRange, formatDuration, formatMonth, formatNumber } from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import { PREVIOUS_PERIOD_WORDS, type RangeType, type RangeWindow } from "@/lib/ga4/ranges";
import type { Payload, ReportName } from "@/lib/ga4/reports";
import { buildSummary } from "@/lib/summary/summary";
import { RefreshSoon } from "./refresh-soon";
import { TopBar } from "./top-bar";

export type DashboardReports = { [R in ReportName]?: { data: Payload<R> | null } };

type DashboardViewProps = {
  range: RangeType;
  window: RangeWindow;
  reports: DashboardReports;
  signupEvent: string | null;
  /** False when the previous period started before the property existed. */
  comparable: boolean;
  /** The switcher, or a "Sample data" badge. */
  site: ReactNode;
  /** State banners and notices, shown above the cards. */
  notices?: ReactNode;
  /** The Signups picker: in the card when no event is chosen, behind "Change" otherwise. */
  signupPicker?: ReactNode;
  /** Grey the numbers out: they are cached and can't be refreshed. */
  dimmed?: boolean;
  /** Set when a background refresh started: the page reloads its data once. */
  refreshToken?: string | null;
  /** Where the date switch links to. */
  basePath?: "/dashboard" | "/ui-kit/dashboard";
  /** Chart notes in this range, and the panel to add and edit them. */
  notes?: { id: string; day: string; text: string }[];
  notesPanel?: ReactNode;
  /** The "Right now" card (it loads on its own). */
  live?: ReactNode;
  /** Show "Download CSV" on the cards. */
  csv?: boolean;
  /** Trial over and unpaid: this panel sits over the cards, which can't be used. */
  lockedPanel?: ReactNode;
  /** Below the cards, e.g. "Share your stats publicly?". */
  footer?: ReactNode;
};

export function periodLabel(window: RangeWindow) {
  const { start, end } = window.current;
  return window.granularity === "yearMonth"
    ? `${formatMonth(start)} – ${formatMonth(end)}`
    : formatDayRange(start, end);
}

/** The dashboard page body, shared by real sites and sample data (docs/SPEC.md section 11). */
export function DashboardView(props: DashboardViewProps) {
  const { range, window, reports, signupEvent, comparable, dimmed } = props;
  const totals = reports.totals?.data ?? null;
  const stats = deriveStats(totals, reports.actions?.data ?? null, signupEvent, comparable);
  const summary = buildSummary({
    range,
    totals,
    sources: reports.sources?.data ?? null,
    actions: reports.actions?.data ?? null,
    signupEvent,
    comparable,
  });
  const series = reports.series?.data ?? null;
  const points = series
    ? chartPoints(series.points, series.granularity, window.includesYesterday)
    : null;
  const period = periodLabel(window);
  const versus = `vs ${PREVIOUS_PERIOD_WORDS[range]}`;
  const csvLink = (id: CardId) =>
    props.csv ? (
      <CsvLink href={`/api/csv/${id}?range=${range}`} label={cardById[id].title} />
    ) : undefined;
  const marks = points && props.notes ? noteMarks(props.notes, points, window.granularity) : [];
  const common = {
    versus,
    missing: comparable ? undefined : "Not enough history to compare",
    dimmed,
  };

  const cards = (
    <>
      <SummaryLine text={summary} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          id="visitors"
          value={stats ? formatNumber(stats.visitors.value ?? 0) : null}
          change={stats?.visitors.change ?? null}
          actions={csvLink("visitors")}
          {...common}
        />
        <StatCard
          id="page-views"
          value={stats ? formatNumber(stats.pageViews.value ?? 0) : null}
          change={stats?.pageViews.change ?? null}
          actions={csvLink("page-views")}
          {...common}
        />
        <StatCard
          id="avg-time"
          value={stats?.avgTime.value != null ? formatDuration(stats.avgTime.value) : null}
          change={stats?.avgTime.change ?? null}
          actions={csvLink("avg-time")}
          {...common}
        />
        <StatCard
          id="signups"
          value={stats?.signups?.value != null ? formatNumber(stats.signups.value) : null}
          change={stats?.signups?.change ?? null}
          {...common}
          actions={
            signupEvent ? (
              <>
                {props.signupPicker}
                {csvLink("signups")}
              </>
            ) : undefined
          }
        >
          {signupEvent ? undefined : props.signupPicker}
        </StatCard>
      </div>
      <VisitorsCard
        points={points}
        caption={points ? chartCaption(points, window.granularity, period) : ""}
        chart={
          points ? (
            <VisitorsChartLazy points={points} notes={marks} canAddNotes={!!props.notesPanel} />
          ) : null
        }
        dimmed={dimmed}
        actions={csvLink("chart")}
        footer={props.notesPanel}
        hint={
          props.notesPanel && props.notes?.length === 0
            ? "Add a note, like “Launched on Product Hunt”"
            : undefined
        }
      />
      {props.live}
      <div className="grid gap-3 md:grid-cols-2">
        <SourcesCard
          sources={reports.sources?.data ?? null}
          channels={reports.channels?.data ?? null}
          dimmed={dimmed}
          actions={csvLink("sources")}
        />
        <PagesCard
          pages={reports.pages?.data ?? null}
          landing={reports.landing?.data ?? null}
          dimmed={dimmed}
          actions={csvLink("pages")}
        />
        <CountriesCard
          countries={reports.countries?.data ?? null}
          total={totals?.current.visitors ?? null}
          dimmed={dimmed}
          actions={csvLink("countries")}
        />
        <DevicesCard
          devices={reports.devices?.data ?? null}
          dimmed={dimmed}
          actions={csvLink("devices")}
        />
        <AiCard
          sources={reports.ai_sources?.data ?? null}
          pages={reports.ai_pages?.data ?? null}
          dimmed={dimmed}
          actions={csvLink("ai")}
        />
        <ActionsCard
          counts={reports.actions?.data ?? null}
          signupEvent={signupEvent}
          dimmed={dimmed}
          actions={csvLink("actions")}
        />
      </div>
    </>
  );

  return (
    <>
      <TopBar range={range} site={props.site} basePath={props.basePath} />
      <main id="main" className="pb-16">
        <Container className="flex flex-col gap-4 pt-4">
          <h1 className="sr-only">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{period}</span>
            {window.includesYesterday
              ? " · Ends yesterday. Google may still be adding to yesterday."
              : null}
          </p>
          {props.notices}
          {props.lockedPanel ? (
            <div className="relative">
              <div
                inert
                className="pointer-events-none flex flex-col gap-4 opacity-50 blur-xs select-none"
              >
                {cards}
              </div>
              <div className="absolute inset-x-0 top-4 flex justify-center">
                {props.lockedPanel}
              </div>
            </div>
          ) : (
            cards
          )}
          {props.footer}
        </Container>
      </main>
      {props.refreshToken ? <RefreshSoon token={props.refreshToken} /> : null}
    </>
  );
}
