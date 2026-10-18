import { ArrowDownRightIcon, ArrowUpRightIcon, ChevronRightIcon, MinusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpTip } from "@/components/shared/help-tip";
import type { RankedRow } from "@/components/shared/ranked-list";
import { SegmentedRadio } from "@/components/shared/segmented-radio";
import { SiteIcon } from "@/components/shared/site-icon";
import { Badge } from "@/components/ui/badge";
import { cardById } from "@/config/cards";
import type { ChangeLine, MetricChange, Mover } from "@/lib/changes/breakdown";
import { csvFilename } from "@/lib/csv";
import { formatNumber, formatPercent } from "@/lib/format";
import { sourceDomain } from "@/lib/ga4/labels";
import type { ChangedPage } from "@/lib/search-console/insights";
import { cn } from "@/lib/utils";
import { ListDetails } from "./list-details";
import type { ListExport } from "./list-card";

/** Which metric block shows for the checked option (static classes, for Tailwind). */
const SHOWN: Record<MetricChange["id"], string> = {
  visitors:
    "flex group-has-[[name=changes-metric][value=signups]:checked]/changes:hidden group-has-[[name=changes-metric][value=sales]:checked]/changes:hidden",
  signups: "hidden group-has-[[name=changes-metric][value=signups]:checked]/changes:flex",
  sales: "hidden group-has-[[name=changes-metric][value=sales]:checked]/changes:flex",
};

/** "+300" or "−80" (a real minus sign), with an arrow; the words are for screen readers. */
function Change({ delta, className }: { delta: number; className?: string }) {
  const Icon = delta > 0 ? ArrowUpRightIcon : delta < 0 ? ArrowDownRightIcon : MinusIcon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 font-medium tabular-nums",
        delta > 0 && "text-positive",
        delta < 0 && "text-negative",
        delta === 0 && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span aria-hidden="true">
        {delta > 0 ? "+" : delta < 0 ? "−" : ""}
        {formatNumber(Math.abs(delta))}
      </span>
      <span className="sr-only">
        {delta > 0 ? "up" : delta < 0 ? "down" : "no change,"} {formatNumber(Math.abs(delta))}
      </span>
    </span>
  );
}

function ThenNow({
  line,
  className,
}: {
  line: Pick<ChangeLine, "then" | "now">;
  className?: string;
}) {
  return (
    <span className={cn("text-xs whitespace-nowrap text-muted-foreground tabular-nums", className)}>
      {formatNumber(line.then)} → {formatNumber(line.now)}
    </span>
  );
}

function NewBadge({ line }: { line: ChangeLine }) {
  if (line.then > 0 || line.now === 0) return null;
  return (
    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
      New
    </Badge>
  );
}

const position = (p: number | null) => (p === null ? "not shown" : p.toFixed(1));

/**
 * What changed and where (docs/SPEC.md section 31.2), under the four numbers: the
 * sources that moved most, each opening onto its landing pages and, for Google, the
 * searches. Native disclosure rows and CSS radios: no JavaScript needed.
 */
export function WhatChangedCard({
  metrics,
  versus,
  missing,
  exportInfo,
  searchDays,
  footer,
}: {
  metrics: MetricChange[];
  /** "vs the previous 30 days". */
  versus: string;
  /** Why the period can't be compared, or null. */
  missing: string | null;
  exportInfo: ListExport;
  /** The Search Console days behind the Google lines: "16 Sep – 15 Oct". */
  searchDays?: string | null;
  /** Under the card's lines, e.g. Free's line about Pro. */
  footer?: ReactNode;
}) {
  const card = cardById["what-changed"];
  return (
    <section
      id="what-changed"
      aria-labelledby="what-changed-title"
      className="group/changes @container flex min-w-0 flex-col gap-3 rounded-2xl border bg-card px-3 pt-3 pb-2 text-card-foreground shadow-xs @sm:px-4 @sm:pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <div className="flex items-center gap-1 self-center">
            <h2 id="what-changed-title" className="text-sm font-semibold">
              {card.title}
            </h2>
            <HelpTip id="what-changed" label={card.title}>
              {card.help}
            </HelpTip>
          </div>
          <span className="text-xs text-muted-foreground">{versus}</span>
        </div>
        {metrics.length > 1 && !missing ? (
          <SegmentedRadio
            name="changes-metric"
            label="Show what changed for"
            options={metrics.map((m) => ({ value: m.id, label: m.label }))}
          />
        ) : null}
      </div>
      {missing ? (
        <EmptyState title={missing}>
          There&apos;s no period before this one to compare with yet.
        </EmptyState>
      ) : (
        metrics.map((metric) => (
          <div
            key={metric.id}
            className={cn("flex-col gap-2", metrics.length > 1 ? SHOWN[metric.id] : "flex")}
          >
            <MetricChanges
              metric={metric}
              versus={versus}
              exportInfo={exportInfo}
              help={card.help}
              searchDays={searchDays ?? null}
            />
          </div>
        ))
      )}
      {missing ? null : footer}
    </section>
  );
}

function Headline({ metric }: { metric: MetricChange }) {
  const { total, change, steady } = metric.breakdown;
  const name = metric.label;
  if (!total) {
    return <p className="text-sm font-medium">The biggest moves in {name.toLowerCase()}</p>;
  }
  const numbers = <ThenNow line={total} className="text-sm" />;
  if (change === null) {
    return (
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
        {name}: {formatNumber(total.now)}
        <span className="text-xs font-normal text-muted-foreground">none the period before</span>
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
      {steady ? (
        <span>{name} about the same</span>
      ) : (
        <span className={cn("inline-flex items-center gap-1")}>
          {name} {change > 0 ? "up" : "down"} {formatPercent(change)}
          {change > 0 ? (
            <ArrowUpRightIcon className="size-4 text-positive" aria-hidden="true" />
          ) : (
            <ArrowDownRightIcon className="size-4 text-negative" aria-hidden="true" />
          )}
        </span>
      )}
      {numbers}
    </p>
  );
}

function MetricChanges({
  metric,
  versus,
  exportInfo,
  help,
  searchDays,
}: {
  metric: MetricChange;
  versus: string;
  exportInfo: ListExport;
  help: string;
  searchDays: string | null;
}) {
  const { movers, all } = metric.breakdown;
  const detailRows: RankedRow[] = all.map((s) => ({
    key: s.key,
    label: s.label,
    icon: <SiteIcon domain={sourceDomain(s.key)} direct={s.key === "(direct)"} />,
    values: [Math.abs(s.delta), s.then, s.now],
    display: [`${s.delta > 0 ? "+" : s.delta < 0 ? "−" : ""}${formatNumber(Math.abs(s.delta))}`],
  }));
  return (
    <>
      <Headline metric={metric} />
      {movers.length === 0 ? (
        <EmptyState
          title={`Nothing moved by ${metric.id === "visitors" ? 3 : 2} or more ${versus}.`}
        />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {movers.map((mover) => (
            <li key={mover.key}>
              <MoverRow
                mover={mover}
                google={mover.key === "google" ? (metric.google ?? null) : null}
                searchDays={searchDays}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex h-8 items-center justify-center pointer-coarse:h-11">
        {all.length > movers.length ? (
          <ListDetails
            title={`What changed: ${metric.label.toLowerCase()}`}
            description={help}
            itemLabel="Source"
            columns={["Change", "Before", "Now"]}
            rows={detailRows}
            fileName={csvFilename(
              exportInfo.site,
              `what-changed-${metric.id}`,
              exportInfo.start,
              exportInfo.end,
            )}
            triggerLabel="See all changes"
          />
        ) : null}
      </div>
    </>
  );
}

function MoverRow({
  mover,
  google,
  searchDays,
}: {
  mover: Mover;
  google: ChangedPage | null;
  searchDays: string | null;
}) {
  const summary = (
    <>
      <SiteIcon domain={sourceDomain(mover.key)} direct={mover.key === "(direct)"} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium" title={mover.label}>
        {mover.label}
      </span>
      <NewBadge line={mover} />
      <Change delta={mover.delta} className="text-sm" />
      <ThenNow line={mover} className="w-20 text-right" />
    </>
  );
  const rowClass = "flex min-h-9 items-center gap-2 rounded-lg px-2 py-1.5 pointer-coarse:min-h-11";
  if (mover.pages.length === 0 && !google) {
    return <div className={cn(rowClass, "pl-8")}>{summary}</div>;
  }
  return (
    <details className="group/row">
      <summary
        className={cn(
          rowClass,
          "cursor-pointer list-none transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/row:rotate-90"
          aria-hidden="true"
        />
        {summary}
      </summary>
      <div className="flex flex-col gap-1 pt-1 pr-2 pb-2 pl-8">
        {mover.pages.map((page) => (
          <div key={page.key} className="flex min-h-7 items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate" title={page.label}>
              {page.label}
            </span>
            <NewBadge line={page} />
            <Change delta={page.delta} className="text-xs" />
            <ThenNow line={page} className="w-20 text-right" />
          </div>
        ))}
        {google ? <GoogleLines page={google} searchDays={searchDays} /> : null}
      </div>
    </details>
  );
}

function GoogleLines({ page, searchDays }: { page: ChangedPage; searchDays: string | null }) {
  return (
    <div className="mt-1 flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 text-xs">
      <p className="text-muted-foreground">
        On Google search{searchDays ? ` (${searchDays})` : ""}: clicks to{" "}
        <span className="font-medium text-foreground">{page.label}</span>{" "}
        <span className="whitespace-nowrap tabular-nums">
          {formatNumber(page.clicksThen)} → {formatNumber(page.clicksNow)}
        </span>
      </p>
      {page.queries.slice(0, 2).map((q) => (
        <p key={q.query} className="text-pretty">
          <span className="font-medium">“{q.query}”</span>{" "}
          <span className="text-muted-foreground">
            <span className="whitespace-nowrap">
              position {position(q.positionThen)} → {position(q.positionNow)},
            </span>{" "}
            <span className="whitespace-nowrap tabular-nums">
              clicks {formatNumber(q.clicksThen)} → {formatNumber(q.clicksNow)}
            </span>
          </span>
        </p>
      ))}
    </div>
  );
}
