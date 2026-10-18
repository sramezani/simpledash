import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpTip } from "@/components/shared/help-tip";
import { SegmentedRadio } from "@/components/shared/segmented-radio";
import { SiteIcon } from "@/components/shared/site-icon";
import type { RankedRow } from "@/components/shared/ranked-list";
import { cardById } from "@/config/cards";
import { customerCounts } from "@/lib/customers/counts";
import { customerHighlights } from "@/lib/customers/highlights";
import { currencyDigits, formatMoney, formatNumber } from "@/lib/format";
import { sourceDomain } from "@/lib/ga4/labels";
import type { DayBuckets, Payloads } from "@/lib/ga4/reports";
import { cn } from "@/lib/utils";
import { ListCard, ListViews, type ListExport, type ListView } from "./list-card";

/** Our guide to sending GA4's purchase event (docs/SPEC.md section 30). */
const GA4_PURCHASE_GUIDE = "/guides/track-purchases-ga4";

export type SalesData = {
  /** Last visit: GA4's session source and landing page. */
  sources: Payloads["sources"] | null;
  landing: Payloads["landing"] | null;
  goalsSources: Payloads["goals_sources"] | null;
  goalsLanding: Payloads["goals_landing"] | null;
  pageSources: Payloads["sale_page_sources"] | null;
  pageLanding: Payloads["sale_page_landing"] | null;
  purchaseSources: Payloads["purchase_sources"] | null;
  purchaseLanding: Payloads["purchase_landing"] | null;
  /** First visit: GA4's first user source. Null when GA4 couldn't answer. */
  firstGoals: Payloads["first_goals"] | null;
  firstPages: Payloads["first_sale_page"] | null;
  firstPurchase: Payloads["first_purchase"] | null;
  goalPaths: Payloads["goal_paths"] | null;
  pagePaths: Payloads["sale_page_paths"] | null;
  goalDays: Payloads["goal_days"] | null;
  pageDays: Payloads["sale_page_days"] | null;
};

type Metric = {
  id: "signups" | "sales";
  /** "Signups", for the switch and the column. */
  column: string;
  /** "signups", for the sentences. */
  noun: string;
  event: string | null;
  page: string | null;
};

/** Which metric block shows: the sales one while "Sales" is checked (static classes, for Tailwind). */
const SHOWN: Record<Metric["id"], string> = {
  signups: "flex group-has-[[name=sales-metric][value=sales]:checked]/metric:hidden",
  sales: "hidden group-has-[[name=sales-metric][value=sales]:checked]/metric:flex",
};

/** GA4's purchase revenue (major units) in the currency's smallest unit, for formatMoney. */
const minor = (amount: number, currency: string) =>
  Math.round(amount * 10 ** currencyDigits(currency));

const sourceIcon = (source: string) => (
  <SiteIcon domain={sourceDomain(source)} direct={source === "(direct)"} />
);

/**
 * What brings customers (docs/SPEC.md section 31.1), Pro. For signups and for sales:
 * where the people first came from next to the visit it happened on, the paths
 * between the two, how long it took, and landing pages. GA4's own whole counts only;
 * revenue only when GA4 itself has purchase values.
 */
export function SalesCard({
  data,
  signupEvent,
  saleEvent,
  salePage,
  currency,
  exportInfo,
  settingsHref,
}: {
  data: SalesData;
  signupEvent: string | null;
  saleEvent: string | null;
  salePage: string | null;
  /** The GA4 property's currency, for its purchase revenue. */
  currency: string;
  exportInfo: ListExport;
  /** Settings → What counts as a sale? */
  settingsHref: string;
}) {
  const card = cardById.sales;
  const hasSale = !!(saleEvent || salePage);
  const metrics: Metric[] = [
    ...(signupEvent
      ? [
          {
            id: "signups",
            column: "Signups",
            noun: "signups",
            event: signupEvent,
            page: null,
          } as const,
        ]
      : []),
    ...(hasSale
      ? [{ id: "sales", column: "Sales", noun: "sales", event: saleEvent, page: salePage } as const]
      : []),
  ];

  const settings = (
    <Link
      href={settingsHref as Route}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      Settings
    </Link>
  );
  const withRevenue = (data.purchaseSources?.total ?? 0) > 0;
  const intro = (
    <p className="text-xs text-pretty text-muted-foreground">
      <strong className="font-medium text-foreground">First</strong>: where people first found you.{" "}
      <strong className="font-medium text-foreground">Last</strong>: the visit it happened on.{" "}
      {!hasSale ? (
        <>Tell us what counts as a sale in {settings} to see sales here. </>
      ) : salePage && !saleEvent ? (
        <>Sales are views of {salePage}. </>
      ) : null}
      {!hasSale ? null : withRevenue ? (
        "Revenue (GA4's own purchase value) is in Details."
      ) : (
        <>
          GA4 has no purchase values in this period, so revenue isn&apos;t shown.{" "}
          <a
            href={GA4_PURCHASE_GUIDE}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            How to send them
          </a>
        </>
      )}
    </p>
  );

  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <h2 id="sales-title" className="text-sm font-semibold">
          {card.title}
        </h2>
        <HelpTip id="sales" label={card.title}>
          {card.help}
        </HelpTip>
      </div>
      {metrics.length > 1 ? (
        <SegmentedRadio
          name="sales-metric"
          label="Show signups or sales"
          options={metrics.map((m) => ({ value: m.id, label: m.column }))}
          defaultValue="sales"
        />
      ) : null}
    </div>
  );

  return (
    <div className="group/metric">
      <ListCard
        id="sales"
        title={card.title}
        heading={heading}
        help={card.help}
        exportInfo={exportInfo}
        views={[]}
      >
        {metrics.length === 0 ? (
          <EmptyState title="Choose your signup event or a sale to see what brings customers.">
            Pick a signup event under the Signups number, or tell us what counts as a sale in{" "}
            {settings}.
          </EmptyState>
        ) : (
          <>
            {intro}
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className={cn(
                  "flex-1 flex-col gap-3",
                  metrics.length > 1 ? SHOWN[metric.id] : "flex",
                )}
              >
                <MetricBlock
                  metric={metric}
                  data={data}
                  currency={currency}
                  withRevenue={withRevenue && metric.id === "sales"}
                  help={card.help}
                  exportInfo={exportInfo}
                />
              </div>
            ))}
          </>
        )}
      </ListCard>
    </div>
  );
}

function MetricBlock({
  metric,
  data,
  currency,
  withRevenue,
  help,
  exportInfo,
}: {
  metric: Metric;
  data: SalesData;
  currency: string;
  withRevenue: boolean;
  help: string;
  exportInfo: ListExport;
}) {
  const { event, page } = metric;
  const count = (events: Record<string, number> | undefined) =>
    event ? (events?.[event] ?? 0) : 0;
  const money = (amount: number) => formatMoney(minor(amount, currency), currency);
  const counts = customerCounts(data, metric);
  const { hasFirst, paths, pathsComplete } = counts;

  // ── By source: first visit next to last visit, with GA4's revenue in Details ──
  const revenue = new Map<string, { first: number; last: number }>();
  const revenueOf = (raw: string) => {
    const found = revenue.get(raw) ?? { first: 0, last: 0 };
    revenue.set(raw, found);
    return found;
  };
  if (withRevenue) {
    for (const r of data.purchaseSources?.rows ?? []) revenueOf(r.source).last += r.revenue;
    for (const r of data.firstPurchase?.rows ?? []) revenueOf(r.source).first += r.revenue;
  }
  const sourceRows: RankedRow[] = [...counts.sources]
    .sort((a, b) => (hasFirst ? b.first - a.first : 0) || b.last - a.last)
    .map((s) => {
      const r = revenue.get(s.source) ?? { first: 0, last: 0 };
      return {
        key: s.source,
        label: s.label,
        icon: sourceIcon(s.source),
        values: [
          ...(hasFirst ? [s.first] : []),
          s.last,
          ...(withRevenue ? [...(hasFirst ? [r.first] : []), r.last] : []),
        ],
        display: [
          ...(hasFirst ? [null] : []),
          null,
          ...(withRevenue ? [...(hasFirst ? [money(r.first)] : []), money(r.last)] : []),
        ],
      };
    });
  const sourceColumns = hasFirst ? ["First", "Last"] : [metric.column];

  // ── Paths: first visit → last visit ──
  const pathRows: RankedRow[] = (paths ?? []).map((p) => ({
    key: `${p.first}\t${p.last}`,
    label: `${p.firstLabel} → ${p.lastLabel}`,
    icon: sourceIcon(p.first),
    values: [p.count],
  }));

  // ── Landing pages of the visits it happened on ──
  const byPage = new Map<string, { visitors: number; count: number; revenue: number }>();
  const landing = (path: string) => {
    const found = byPage.get(path) ?? { visitors: 0, count: 0, revenue: 0 };
    byPage.set(path, found);
    return found;
  };
  for (const r of data.landing?.rows ?? []) landing(r.path).visitors += r.visitors;
  for (const r of data.goalsLanding?.rows ?? []) landing(r.path).count += count(r.events);
  if (page) for (const r of data.pageLanding?.rows ?? []) landing(r.path).count += r.views;
  if (withRevenue)
    for (const r of data.purchaseLanding?.rows ?? []) landing(r.path).revenue += r.revenue;
  const pageRows: RankedRow[] = [...byPage]
    .filter(([, p]) => p.count > 0 || p.revenue > 0)
    .sort(([, a], [, b]) => b.count - a.count || b.visitors - a.visitors)
    .map(([path, p]) => ({
      key: path,
      label: path,
      // The metric first, so the soft bar shows what brought it.
      values: [p.count, p.visitors, ...(withRevenue ? [p.revenue] : [])],
      display: [null, null, ...(withRevenue ? [money(p.revenue)] : [])],
    }));

  const none = `No ${metric.noun} recorded in this period.`;
  const views: ListView[] = [
    {
      value: "sources",
      label: "By source",
      itemLabel: "Source",
      columns: [
        ...sourceColumns,
        ...(withRevenue
          ? hasFirst
            ? ["Revenue, first visit", "Revenue, last visit"]
            : ["Revenue"]
          : []),
      ],
      cardColumns: sourceColumns,
      empty: <EmptyState title={none} />,
      rows: sourceRows,
    },
    ...(pathRows.length
      ? [
          {
            value: "paths",
            label: "Paths",
            itemLabel: "First visit → last visit",
            columns: [metric.column],
            empty: <EmptyState title={none} />,
            rows: pathRows,
          },
        ]
      : []),
    {
      value: "landing",
      label: "Landing pages",
      itemLabel: "Landing page",
      columns: [metric.column, "Visitors", ...(withRevenue ? ["Revenue"] : [])],
      cardColumns: [metric.column, "Visitors"],
      empty: <EmptyState title={none} />,
      rows: pageRows,
    },
  ];

  const highlights = hasFirst
    ? customerHighlights({
        noun: metric.noun,
        sources: counts.sources,
        paths: pathsComplete ? paths : null,
      })
    : [];
  const days = dayTotals(metric, data);

  return (
    <>
      {highlights.length ? (
        <ul className="flex flex-col gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-pretty">
          {highlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {days ? <DaysLine days={days} /> : null}
      <ListViews
        id={`sales-${metric.id}`}
        help={help}
        views={views}
        exportInfo={exportInfo}
        initial={8}
      />
    </>
  );
}

/** Days from the first visit for a metric, or null when GA4's list is missing or cut off. */
function dayTotals(metric: Metric, data: SalesData): DayBuckets | null {
  const parts: DayBuckets[] = [];
  if (metric.event) {
    if (!data.goalDays?.complete) return null;
    const found = data.goalDays.events[metric.event];
    if (found) parts.push(found);
  }
  if (metric.page) {
    if (!data.pageDays?.complete) return null;
    parts.push(data.pageDays.days);
  }
  const sum: DayBuckets = { sameDay: 0, week: 0, month: 0, later: 0, unknown: 0 };
  for (const p of parts) for (const k of Object.keys(sum) as (keyof DayBuckets)[]) sum[k] += p[k];
  const known = sum.sameDay + sum.week + sum.month + sum.later;
  return known > 0 ? sum : null;
}

function DaysLine({ days }: { days: DayBuckets }) {
  const groups: [string, number][] = [
    ["same day", days.sameDay],
    ["1–7 days", days.week],
    ["8–30 days", days.month],
    ["over 30 days", days.later],
    ...(days.unknown > 0 ? ([["not recorded", days.unknown]] as [string, number][]) : []),
  ];
  return (
    <p className="text-xs text-pretty text-muted-foreground">
      Time from first visit:{" "}
      {groups.map(([label, n], i): ReactNode => (
        <span key={label}>
          {i > 0 ? " · " : null}
          <span className="whitespace-nowrap">
            {label}{" "}
            <span className="font-medium text-foreground tabular-nums">{formatNumber(n)}</span>
          </span>
        </span>
      ))}
    </p>
  );
}
