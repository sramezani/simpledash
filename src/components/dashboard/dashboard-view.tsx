import type { ReactNode } from "react";
import { ActionsCard } from "@/components/cards/actions-card";
import { AiCard } from "@/components/cards/ai-card";
import { CountriesCard } from "@/components/cards/countries-card";
import { DevicesCard } from "@/components/cards/devices-card";
import { OverviewCard, type OverviewMetric } from "@/components/cards/overview-card";
import { PagesCard } from "@/components/cards/pages-card";
import { SourcesCard } from "@/components/cards/sources-card";
import { SummaryLine } from "@/components/cards/summary-line";
import { VisitorsChartLazy } from "@/components/charts/visitors-chart-lazy";
import { Container } from "@/components/shared/container";
import { CsvLink } from "@/components/shared/csv-link";
import { CsvMenu } from "@/components/shared/csv-menu";
import { OverviewToolbar } from "@/components/shared/overview-toolbar";
import { PopoverButton } from "@/components/shared/popover-button";
import { cardById, type CardId } from "@/config/cards";
import { chartCaption, chartPoints, noteMarks, periodLabel } from "@/lib/charts/series";
import { formatDuration, formatNumber } from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import {
  freshnessNote,
  PREVIOUS_PERIOD_WORDS,
  rangeMenu,
  type RangeType,
  type RangeWindow,
} from "@/lib/ga4/ranges";
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
  /** Why the numbers can't be compared with the period before, or null when they can. */
  comparisonGap: string | null;
  /** The site switcher, or the sample site's chip. */
  site: ReactNode;
  /** State banners and notices, shown above the cards. */
  notices?: ReactNode;
  /** The Signups picker: behind "Choose an event", or behind "Change" once one is chosen. */
  signupPicker?: ReactNode;
  /** Grey the numbers out: they are cached and can't be refreshed. */
  dimmed?: boolean;
  /** Set when a background refresh started: the page reloads its data once. */
  refreshToken?: string | null;
  /** Where the date menu links to. */
  basePath?: "/dashboard" | "/ui-kit/dashboard";
  /** Other search params the date menu keeps (dev preview). */
  query?: Record<string, string>;
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

/** The dashboard page body, shared by real sites and sample data (docs/SPEC.md section 11). */
export function DashboardView(props: DashboardViewProps) {
  const { range, window, reports, signupEvent, comparisonGap, dimmed } = props;
  const comparable = comparisonGap === null;
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
    ? chartPoints(series.points, series.granularity, window.lastPointPending)
    : null;
  const period = periodLabel(window);
  const versus = `vs ${PREVIOUS_PERIOD_WORDS[range]}`;
  const csvHref = (id: CardId) => `/api/csv/${id}?range=${range}`;
  const csvLink = (id: CardId) =>
    props.csv ? <CsvLink href={csvHref(id)} label={cardById[id].title} /> : undefined;
  const marks = points && props.notes ? noteMarks(props.notes, points, window.granularity) : [];

  const metrics: OverviewMetric[] = [
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
      action: signupEvent ? props.signupPicker : undefined,
      children:
        signupEvent || !props.signupPicker ? undefined : (
          <PopoverButton
            id="signup-pick"
            panel={props.signupPicker}
            panelClassName="w-80"
            className="inline-flex h-9 items-center self-start rounded-lg border border-dashed px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-muted pointer-coarse:h-11"
          >
            Choose your signup event
          </PopoverButton>
        ),
    },
  ];

  const csvCards: CardId[] = ["chart", "visitors", "page-views", "avg-time"];
  if (signupEvent) csvCards.push("signups");
  const csvItems = csvCards.map((id) => ({ href: csvHref(id), label: cardById[id].title }));

  const cards = (
    <>
      <SummaryLine text={summary} />
      <OverviewCard
        metrics={metrics}
        versus={versus}
        missing={comparisonGap ?? undefined}
        points={points}
        caption={points ? chartCaption(points, window.granularity, period) : ""}
        chart={
          points ? (
            <VisitorsChartLazy points={points} notes={marks} canAddNotes={!!props.notesPanel} />
          ) : null
        }
        dimmed={dimmed}
        actions={props.csv ? <CsvMenu id="overview" items={csvItems} /> : undefined}
        footer={props.notesPanel}
        hint={
          props.notesPanel && props.notes?.length === 0 && window.granularity !== "dateHour"
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
      <TopBar basePath={props.basePath} />
      <main id="main" className="pb-16">
        <Container className="flex flex-col gap-4 pt-5">
          <h1 className="sr-only">Dashboard</h1>
          <OverviewToolbar
            site={props.site}
            range={range}
            options={rangeMenu(props.basePath ?? "/dashboard", props.query)}
            period={period}
            note={freshnessNote(window)}
          />
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
