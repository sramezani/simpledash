import { PagesCard } from "@/components/cards/pages-card";
import { SourcesCard } from "@/components/cards/sources-card";
import { StatCard } from "@/components/cards/stat-card";
import { SummaryLine } from "@/components/cards/summary-line";
import { VisitorsCard } from "@/components/cards/visitors-card";
import { StaticLineChart } from "@/components/charts/static-line-chart";
import { Badge } from "@/components/ui/badge";
import { chartCaption, chartPoints } from "@/lib/charts/series";
import { formatDayRange, formatDuration, formatMonth, formatNumber } from "@/lib/format";
import { deriveStats } from "@/lib/ga4/derive";
import { PREVIOUS_PERIOD_WORDS, rangeWindow, RANGE_TYPES, type RangeType } from "@/lib/ga4/ranges";
import { sampleReports, SAMPLE_DOMAIN, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";
import { buildSummary } from "@/lib/summary/summary";
import { DemoSwitch } from "./demo-switch";

/** One range of the demo: the real cards in their static mode, on sample data. */
function DemoView({ range, now }: { range: RangeType; now: Date }) {
  const window = rangeWindow(range, "UTC", now);
  const r = sampleReports(window, [
    "totals",
    "series",
    "sources",
    "channels",
    "pages",
    "landing",
    "actions",
  ]);
  const stats = deriveStats(r.totals.data, r.actions.data, SAMPLE_SIGNUP_EVENT, true)!;
  const points = chartPoints(r.series.data.points, window.granularity, window.includesYesterday);
  const period =
    window.granularity === "yearMonth"
      ? `${formatMonth(window.current.start)} – ${formatMonth(window.current.end)}`
      : formatDayRange(window.current.start, window.current.end);
  const versus = `vs ${PREVIOUS_PERIOD_WORDS[range]}`;
  return (
    <div className="flex flex-col gap-3">
      <SummaryLine
        text={buildSummary({
          range,
          totals: r.totals.data,
          sources: r.sources.data,
          actions: r.actions.data,
          signupEvent: SAMPLE_SIGNUP_EVENT,
          comparable: true,
        })}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          id="visitors"
          value={formatNumber(stats.visitors.value ?? 0)}
          change={stats.visitors.change}
          versus={versus}
        />
        <StatCard
          id="page-views"
          value={formatNumber(stats.pageViews.value ?? 0)}
          change={stats.pageViews.change}
          versus={versus}
        />
        <StatCard
          id="avg-time"
          value={formatDuration(stats.avgTime.value ?? 0)}
          change={stats.avgTime.change}
          versus={versus}
        />
        <StatCard
          id="signups"
          value={formatNumber(stats.signups?.value ?? 0)}
          change={stats.signups?.change ?? null}
          versus={versus}
        />
      </div>
      <VisitorsCard
        points={points}
        caption={chartCaption(points, window.granularity, period)}
        chart={<StaticLineChart points={points} />}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <SourcesCard sources={r.sources.data} channels={r.channels.data} />
        <PagesCard pages={r.pages.data} landing={r.landing.data} />
      </div>
    </div>
  );
}

/**
 * The landing page's demo dashboard (docs/SPEC.md section 17): the real card
 * components on sample data, a static SVG chart, and a tiny date-switch island.
 */
export function DemoDashboard({ now }: { now: Date }) {
  return (
    <div className="rounded-2xl border bg-background p-3 shadow-lg sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1 text-sm">
        <span className="font-medium">{SAMPLE_DOMAIN}</span>
        <Badge variant="outline">Sample data</Badge>
      </div>
      <DemoSwitch
        views={
          Object.fromEntries(
            RANGE_TYPES.map((r) => [r, <DemoView key={r} range={r} now={now} />]),
          ) as Record<RangeType, React.ReactNode>
        }
      />
    </div>
  );
}
