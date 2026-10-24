import type { Route } from "next";
import type { ReactNode } from "react";
import { ActionsCard } from "@/components/cards/actions-card";
import { AiCard } from "@/components/cards/ai-card";
import { CountriesCard } from "@/components/cards/countries-card";
import { DevicesCard } from "@/components/cards/devices-card";
import { OverviewCard, type OverviewMetric } from "@/components/cards/overview-card";
import { PagesCard } from "@/components/cards/pages-card";
import { SourcesCard } from "@/components/cards/sources-card";
import { VisitorsChartLazy } from "@/components/charts/visitors-chart-lazy";
import { Container } from "@/components/shared/container";
import { CsvMenu } from "@/components/shared/csv-menu";
import { OverviewToolbar } from "@/components/shared/overview-toolbar";
import { PopoverButton } from "@/components/shared/popover-button";
import { cardById, type CardId } from "@/config/cards";
import {
  chartCaption,
  chartPoints,
  noteMarks,
  periodLabel,
  withRevenue,
} from "@/lib/charts/series";
import { formatDuration, formatNumber } from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import {
  freshnessNote,
  isPreset,
  previousPeriodWords,
  rangeMenu,
  type HistoryLimit,
  type RangeType,
  type RangeWindow,
} from "@/lib/ga4/ranges";
import type { Payload, ReportName } from "@/lib/ga4/reports";
import { settingsRoutes } from "@/lib/settings-routes";
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
  /** The site's address or name, for download file names. */
  siteName: string;
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
  /** The site shown, kept in the date menu's links, downloads and Settings link. */
  siteId?: string;
  /** Chart notes in this range, and the panel to add and edit them. */
  notes?: { id: string; day: string; text: string }[];
  notesPanel?: ReactNode;
  /** The live count, the last number of the overview, which opens the live view (it loads on its own). */
  live?: ReactNode;
  /** What changed and where, right under the four numbers (it loads on its own). */
  changes?: ReactNode;
  /** Show "Download CSV" on the cards. */
  csv?: boolean;
  /** Free's 30 days: the date menu marks longer ranges "Pro" and the calendar stops there. */
  historyLimit?: HistoryLimit | null;
  /** Below the cards, e.g. "Share your stats publicly?". */
  footer?: ReactNode;
  /** The Google search card (Pro), or its teaser, under the list cards. */
  search?: ReactNode;
  /** What brings customers (Pro), under the list cards. */
  sales?: ReactNode;
  /** Revenue and New customers (Pro), after the four numbers. */
  extraMetrics?: OverviewMetric[];
  /** Revenue per day in `revenueCurrency`'s smallest unit, as bars under the line. */
  revenueByDay?: Map<string, number>;
  revenueCurrency?: string;
  /** Owner-only hints in the cards, e.g. the payment-page warning in Sources. */
  ownerTips?: boolean;
};

/** The dashboard page body, shared by real sites and sample data (docs/SPEC.md section 11). */
export function DashboardView(props: DashboardViewProps) {
  const { range, window, reports, signupEvent, comparisonGap, dimmed } = props;
  const comparable = comparisonGap === null;
  const totals = reports.totals?.data ?? null;
  const stats = deriveStats(totals, reports.actions?.data ?? null, signupEvent, comparable);
  const series = reports.series?.data ?? null;
  const basePoints = series
    ? chartPoints(series.points, series.granularity, window.lastPointPending)
    : null;
  const points =
    basePoints && props.revenueByDay
      ? withRevenue(basePoints, series!.granularity, props.revenueByDay)
      : basePoints;
  const revenueCurrency = props.revenueByDay ? props.revenueCurrency : undefined;
  const period = periodLabel(window);
  const versus = `vs ${previousPeriodWords(range)}`;
  const siteParam = props.siteId ? `&site=${props.siteId}` : "";
  const csvHref = (id: CardId) => `/api/csv/${id}?range=${encodeURIComponent(range)}${siteParam}`;
  const query = props.siteId ? { site: props.siteId, ...props.query } : props.query;
  const exportInfo = { site: props.siteName, ...window.current };
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
    ...(props.extraMetrics ?? []),
  ];

  const csvCards: CardId[] = ["chart", "visitors", "page-views", "avg-time"];
  if (signupEvent) csvCards.push("signups");
  const csvItems = csvCards.map((id) => ({ href: csvHref(id), label: cardById[id].title }));

  const cards = (
    <>
      <OverviewCard
        metrics={metrics}
        versus={versus}
        missing={comparisonGap ?? undefined}
        points={points}
        caption={points ? chartCaption(points, window.granularity, period) : ""}
        chart={
          points ? (
            <VisitorsChartLazy
              points={points}
              notes={marks}
              canAddNotes={!!props.notesPanel}
              revenueCurrency={revenueCurrency}
            />
          ) : null
        }
        dimmed={dimmed}
        revenueCurrency={revenueCurrency}
        live={props.live}
        actions={props.csv ? <CsvMenu id="overview" items={csvItems} /> : undefined}
        footer={props.notesPanel}
        hint={
          props.notesPanel && props.notes?.length === 0 && window.granularity !== "dateHour"
            ? "Add a note, like “Launched on Product Hunt”"
            : undefined
        }
      />
      {props.changes}
      <div className="grid gap-3 md:grid-cols-2">
        <SourcesCard
          sources={reports.sources?.data ?? null}
          channels={reports.channels?.data ?? null}
          exportInfo={exportInfo}
          dimmed={dimmed}
          ownerTips={props.ownerTips}
        />
        <PagesCard
          pages={reports.pages?.data ?? null}
          landing={reports.landing?.data ?? null}
          exportInfo={exportInfo}
          dimmed={dimmed}
        />
        <CountriesCard
          countries={reports.countries?.data ?? null}
          cities={reports.cities?.data ?? null}
          total={totals?.current.visitors ?? null}
          exportInfo={exportInfo}
          dimmed={dimmed}
        />
        <DevicesCard
          browsers={reports.browsers?.data ?? null}
          systems={reports.systems?.data ?? null}
          devices={reports.devices?.data ?? null}
          exportInfo={exportInfo}
          dimmed={dimmed}
        />
        <AiCard
          sources={reports.ai_sources?.data ?? null}
          pages={reports.ai_pages?.data ?? null}
          exportInfo={exportInfo}
          dimmed={dimmed}
        />
        <ActionsCard
          counts={reports.actions?.data ?? null}
          signupEvent={signupEvent}
          exportInfo={exportInfo}
          dimmed={dimmed}
        />
      </div>
      {props.sales}
      {props.search}
    </>
  );

  return (
    <>
      <TopBar
        basePath={props.basePath}
        settingsHref={props.siteId ? (settingsRoutes.site(props.siteId) as Route) : undefined}
      />
      <main id="main" className="pb-16">
        <Container className="flex flex-col gap-4 pt-5">
          <h1 className="sr-only">Dashboard</h1>
          <OverviewToolbar
            site={props.site}
            menu={rangeMenu(
              range,
              window,
              props.basePath ?? "/dashboard",
              query,
              undefined,
              props.historyLimit,
            )}
            period={isPreset(range) ? period : null}
            note={freshnessNote(window)}
          />
          {props.notices}
          {cards}
          {props.footer}
        </Container>
      </main>
      {props.refreshToken ? <RefreshSoon token={props.refreshToken} /> : null}
    </>
  );
}
