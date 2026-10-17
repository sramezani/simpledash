import type { Route } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpTip } from "@/components/shared/help-tip";
import { SiteIcon } from "@/components/shared/site-icon";
import type { RankedRow } from "@/components/shared/ranked-list";
import { cardById } from "@/config/cards";
import { currencyDigits, formatMoney } from "@/lib/format";
import { sourceDomain } from "@/lib/ga4/labels";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

/** Our guide to sending GA4's purchase event (docs/SPEC.md section 30). */
const GA4_PURCHASE_GUIDE = "/guides/track-purchases-ga4";

type Goal = {
  /** Null when the source isn't in the period's visitor list (it lists the top ones). */
  visitors: number | null;
  signups: number;
  sales: number;
  revenue: number;
};

export type SalesData = {
  sources: Payloads["sources"] | null;
  landing: Payloads["landing"] | null;
  goalsSources: Payloads["goals_sources"] | null;
  goalsLanding: Payloads["goals_landing"] | null;
  pageSources: Payloads["sale_page_sources"] | null;
  pageLanding: Payloads["sale_page_landing"] | null;
  purchaseSources: Payloads["purchase_sources"] | null;
  purchaseLanding: Payloads["purchase_landing"] | null;
};

/** GA4's purchase revenue (major units) in the currency's smallest unit, for formatMoney. */
const minor = (amount: number, currency: string) =>
  Math.round(amount * 10 ** currencyDigits(currency));

/**
 * Sales and signups by source (docs/SPEC.md section 28.3), Pro: Sources | Landing
 * pages with visitors, signups and sales, all GA4's own counts. Revenue only when GA4
 * itself has purchase values; never estimated.
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
  const withRevenue = (data.purchaseSources?.total ?? 0) > 0;
  const columns = [
    "Visitors",
    ...(signupEvent ? ["Signups"] : []),
    ...(hasSale ? ["Sales"] : []),
    ...(withRevenue ? ["Revenue"] : []),
  ];

  const build = (
    keyed: Map<string, Goal & { label: string; icon?: React.ReactNode }>,
  ): RankedRow[] =>
    [...keyed.values()]
      .filter((g) => (g.visitors ?? 0) > 0 || g.signups > 0 || g.sales > 0 || g.revenue > 0)
      .sort(
        (a, b) =>
          b.sales - a.sales || b.signups - a.signups || (b.visitors ?? 0) - (a.visitors ?? 0),
      )
      .map((g) => ({
        key: g.label,
        label: g.label,
        icon: g.icon,
        // Visitors first, so the soft bar shows how much traffic each brings.
        values: [
          g.visitors ?? 0,
          ...(signupEvent ? [g.signups] : []),
          ...(hasSale ? [g.sales] : []),
          ...(withRevenue ? [g.revenue] : []),
        ],
        display: [
          g.visitors === null ? "—" : null,
          ...(signupEvent ? [null] : []),
          ...(hasSale ? [null] : []),
          ...(withRevenue ? [formatMoney(minor(g.revenue, currency), currency)] : []),
        ],
      }));

  const bySource = new Map<string, Goal & { label: string; icon?: React.ReactNode }>();
  const source = (raw: string, label: string) => {
    const found = bySource.get(raw) ?? {
      label,
      icon: <SiteIcon domain={sourceDomain(raw)} direct={raw === "(direct)"} />,
      visitors: null,
      signups: 0,
      sales: 0,
      revenue: 0,
    };
    bySource.set(raw, found);
    return found;
  };
  for (const r of data.sources?.rows ?? []) {
    const s = source(r.source, r.label);
    s.visitors = (s.visitors ?? 0) + r.visitors;
  }
  for (const r of data.goalsSources?.rows ?? []) {
    const s = source(r.source, r.label);
    if (signupEvent) s.signups += r.events[signupEvent] ?? 0;
    if (saleEvent) s.sales += r.events[saleEvent] ?? 0;
  }
  if (salePage)
    for (const r of data.pageSources?.rows ?? []) source(r.source, r.label).sales += r.views;
  for (const r of data.purchaseSources?.rows ?? []) source(r.source, r.label).revenue += r.revenue;

  const byPage = new Map<string, Goal & { label: string }>();
  const page = (path: string) => {
    const found = byPage.get(path) ?? {
      label: path,
      visitors: 0,
      signups: 0,
      sales: 0,
      revenue: 0,
    };
    byPage.set(path, found);
    return found;
  };
  for (const r of data.landing?.rows ?? []) {
    const p = page(r.path);
    p.visitors = (p.visitors ?? 0) + r.visitors;
  }
  for (const r of data.goalsLanding?.rows ?? []) {
    const p = page(r.path);
    if (signupEvent) p.signups += r.events[signupEvent] ?? 0;
    if (saleEvent) p.sales += r.events[saleEvent] ?? 0;
  }
  if (salePage) for (const r of data.pageLanding?.rows ?? []) page(r.path).sales += r.views;
  for (const r of data.purchaseLanding?.rows ?? []) page(r.path).revenue += r.revenue;

  const settings = (
    <Link
      href={settingsHref as Route}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      Settings
    </Link>
  );
  const intro = (
    <p className="text-xs text-pretty text-muted-foreground">
      {!hasSale ? (
        <>Tell us what counts as a sale in {settings} to see sales here. </>
      ) : salePage ? (
        <>Sales are views of {salePage}. </>
      ) : null}
      {withRevenue ? (
        "Revenue is GA4's own purchase value for these visits."
      ) : (
        <>
          GA4 has no purchase values in this period, so revenue per source isn&apos;t shown.{" "}
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

  const empty = <EmptyState title="No visits in this period." />;
  const heading = (
    <div className="flex items-center gap-1">
      <h2 id="sales-title" className="text-sm font-semibold">
        {card.title}
      </h2>
      <HelpTip id="sales" label={card.title}>
        {card.help}
      </HelpTip>
    </div>
  );
  return (
    <ListCard
      id="sales"
      title={card.title}
      heading={heading}
      help={card.help}
      exportInfo={exportInfo}
      intro={intro}
      initial={8}
      views={[
        {
          value: "sources",
          label: "By source",
          itemLabel: "Source",
          columns,
          empty,
          rows: build(bySource),
        },
        {
          value: "landing",
          label: "By landing page",
          itemLabel: "Landing page",
          columns,
          empty,
          rows: build(byPage),
        },
      ]}
    />
  );
}
