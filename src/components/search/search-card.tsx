import { ArrowDownRightIcon, ArrowUpRightIcon, ChevronDownIcon, EyeOffIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ListCard, type ListExport, type ListView } from "@/components/cards/list-card";
import { StackedBars } from "@/components/charts/stacked-bars";
import { Delta } from "@/components/shared/delta";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpTip } from "@/components/shared/help-tip";
import {
  formatDay,
  formatDayRange,
  formatNumber,
  formatPosition,
  formatRate,
  percentChange,
} from "@/lib/format";
import type { SearchCard as SearchData } from "@/lib/search-console/data";
import {
  NEAR_POSITIONS,
  searchesToSignups,
  slippingQuery,
  type ChangedPage,
  type NearGroup,
  type PageQuery,
} from "@/lib/search-console/insights";
import { cn } from "@/lib/utils";

type Ready = Extract<SearchData, { kind: "ready" }>;

export const SEARCH_HELP =
  "From Google Search Console: how often Google showed your site in its results (Seen) and how often people clicked. Search Console is usually 2–3 days behind, counts days in California time, and leaves out searches made by very few people.";

/** "page 2" for positions 11–20: said only next to the position it comes from. */
const pageOf = (position: number) => Math.max(1, Math.ceil(Math.round(position) / 10));

const days = (w: { start: string; end: string }) =>
  w.start === w.end ? formatDay(w.start) : formatDayRange(w.start, w.end);

/**
 * The Google search card (docs/SPEC.md section 28.2): its own dates, four numbers,
 * and five views behind tabs, each from Search Console's own numbers. Server-rendered,
 * with tabs and Details like the other list cards.
 */
export function SearchCard({
  data,
  siteName,
  signupEvent,
  settingsHref,
  note,
  action,
}: {
  data: Ready;
  /** For download file names. */
  siteName: string;
  signupEvent: string | null;
  /** Settings → Google Search Console, where the name spellings are changed. */
  settingsHref: string;
  /** Why these may be older numbers ("Search Console isn't answering…"). */
  note?: string | null;
  /** This week's one thing, above the tabs. */
  action?: ReactNode;
}) {
  const { overview, insights, brand, window } = data;
  const exportInfo: ListExport = { site: siteName, ...window.current };
  const versus = `vs ${days(window.previous)}`;
  const comparable = window.comparable;
  const change = (now: number, before: number) => (comparable ? percentChange(now, before) : null);
  const missing = comparable ? undefined : "Search Console keeps 16 months";

  const heading = (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Image src="/google-g.svg" alt="" width={16} height={16} />
        <h2 id="search-title" className="text-sm font-semibold">
          Google search
        </h2>
        <HelpTip id="search" label="Google search">
          {SEARCH_HELP}
        </HelpTip>
        <p className="text-xs text-muted-foreground">
          {days(window.current)}
          {window.shifted ? " · Google is 2–3 days behind" : ""}
          {window.clipped ? " · Search Console keeps 16 months" : ""}
        </p>
      </div>
      {note ? <p className="text-xs text-warning">{note}</p> : null}
    </div>
  );

  const c = overview.current;
  const p = overview.previous;
  const rate = (t: { clicks: number; impressions: number }) =>
    t.impressions > 0 ? t.clicks / t.impressions : null;
  const numbers = (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b pb-3 @2xl:grid-cols-4">
      <Stat label="Clicks" value={formatNumber(c.clicks)}>
        <Delta
          change={change(c.clicks, p.clicks)}
          missing={missing}
          versus={versus}
          size="compact"
        />
      </Stat>
      <Stat label="Seen" value={formatNumber(c.impressions)}>
        <Delta
          change={change(c.impressions, p.impressions)}
          missing={missing}
          versus={versus}
          size="compact"
        />
      </Stat>
      <Stat label="Click rate" value={rate(c) === null ? "—" : formatRate(rate(c)!)}>
        {comparable && rate(p) !== null ? (
          <span className="text-xs text-muted-foreground">was {formatRate(rate(p)!)}</span>
        ) : null}
      </Stat>
      <Stat label="Position" value={c.position === null ? "—" : formatPosition(c.position)}>
        {comparable && p.position !== null ? (
          <span className="text-xs text-muted-foreground">was {formatPosition(p.position)}</span>
        ) : null}
      </Stat>
    </dl>
  );

  const signups = signupsView(data, signupEvent);
  const views: ListView[] = [
    // With a signup event, the pages that bring signups come first.
    ...(signupEvent ? [signups] : []),
    nearView(insights.near),
    changedView(insights.changed, comparable, days(data.insightsWindow.previous)),
    brandView(brand, overview.current.clicks, comparable, versus, settingsHref),
    unclickedView(insights.unclicked),
    ...(signupEvent ? [] : [signups]),
  ];

  return (
    <ListCard
      id="search"
      title="Google search"
      heading={heading}
      help={SEARCH_HELP}
      intro={
        <>
          {numbers}
          {action}
        </>
      }
      views={views}
      exportInfo={exportInfo}
    />
  );
}

function Stat({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
        {children}
      </dd>
    </div>
  );
}

/** One line of plain words above a view. */
function Intro({ children }: { children: ReactNode }) {
  return <p className="text-xs text-pretty text-muted-foreground">{children}</p>;
}

// ── 1. Close to page 1 ─────────────────────────────────────────────────────

function nearView(near: Ready["insights"]["near"]): ListView {
  return {
    value: "near",
    label: "Close to page 1",
    itemLabel: "Search",
    columns: ["Seen", "Clicks", "Position"],
    cardColumns: ["Seen", "Clicks"],
    sublabelHeader: "Page",
    empty: (
      <EmptyState
        title={`No searches at position ${NEAR_POSITIONS.from} to ${NEAR_POSITIONS.to} in this period.`}
      />
    ),
    rows: near.all.map((r) => ({
      key: `${r.page}\u0000${r.query}`,
      label: r.query,
      sublabel: r.label,
      values: [r.impressions, r.clicks, r.position],
      display: [null, null, formatPosition(r.position)],
    })),
    intro: (
      <Intro>
        {formatNumber(near.count)} {near.count === 1 ? "search" : "searches"} where your page shows
        at position {NEAR_POSITIONS.from} to {NEAR_POSITIONS.to}, grouped by page, most seen first.
      </Intro>
    ),
    content: near.groups.length > 0 ? <NearGroups groups={near.groups} /> : undefined,
  };
}

/** The groups that fit in the card's fixed height: a page, then its top searches. */
function NearGroups({ groups }: { groups: NearGroup[] }) {
  let budget = 10;
  const shown: NearGroup[] = [];
  for (const g of groups) {
    if (budget < 2) break;
    const take = Math.min(g.queries.length, 3, budget - 1);
    shown.push({ ...g, queries: g.queries.slice(0, take) });
    budget -= take + 1;
  }
  return (
    <ol
      aria-label="Searches close to page 1, by page"
      className="flex h-[calc(10*2.375rem-0.125rem)] flex-col gap-1 overflow-hidden"
    >
      {shown.map((g) => (
        <li key={g.page} className="flex flex-col">
          <div className="flex h-8 items-center gap-2 px-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium" title={g.label}>
              {g.label}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              seen {formatNumber(g.impressions)} times
            </span>
          </div>
          <ul className="flex flex-col">
            {g.queries.map((q) => (
              <li
                key={q.query}
                className="relative flex min-h-9 items-center gap-2 rounded-md py-1 pr-2 pl-4 text-sm transition-colors duration-150 hover:bg-muted @md:pl-5"
              >
                {/* Narrow cards put the position under the search, so the search stays readable. */}
                <span className="flex min-w-0 flex-1 flex-col @md:flex-row @md:items-center @md:gap-2">
                  <span className="truncate" title={q.query}>
                    “{q.query}”
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums @md:rounded-md @md:bg-muted @md:px-1.5 @md:py-0.5">
                    position {formatPosition(q.position)}
                    {pageOf(q.position) > 1 ? ` · page ${pageOf(q.position)}` : ""}
                  </span>
                  <span className="sr-only">
                    , seen {formatNumber(q.impressions)} times, {formatNumber(q.clicks)} clicks
                  </span>
                </span>
                <span className="flex shrink-0 gap-2 tabular-nums @sm:gap-4" aria-hidden="true">
                  <span className="w-12 text-right @sm:w-14">{formatNumber(q.impressions)}</span>
                  <span className="w-12 text-right text-muted-foreground @sm:w-14">
                    {formatNumber(q.clicks)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

// ── 2. What changed ────────────────────────────────────────────────────────

function changedView(
  changed: Ready["insights"]["changed"],
  comparable: boolean,
  previous: string,
): ListView {
  const all = [...changed.rising, ...changed.falling];
  return {
    value: "changed",
    label: "What changed",
    itemLabel: "Page",
    columns: ["Before", "Now"],
    sublabelHeader: "Position",
    hideColumns: true,
    empty: comparable ? (
      <EmptyState title="No page's Google clicks changed by 3 or more against the period before." />
    ) : (
      <EmptyState title="Nothing to compare with.">
        Search Console keeps 16 months, so the period before this one isn&apos;t there.
      </EmptyState>
    ),
    rows: comparable
      ? all.map((p) => ({
          key: p.page,
          label: p.label,
          sublabel: positions(p.positionThen, p.positionNow),
          values: [p.clicksThen, p.clicksNow],
        }))
      : [],
    intro: (
      <Intro>
        Google clicks per page against {previous}. Open a page to see the searches behind the
        change.
      </Intro>
    ),
    content:
      comparable && all.length > 0 ? (
        <div className="grid min-h-[calc(9*2.25rem)] content-start gap-x-4 gap-y-3 @2xl:grid-cols-2">
          <ChangeColumn title="Clicks rose" pages={changed.rising} up />
          <ChangeColumn title="Clicks fell" pages={changed.falling} up={false} />
        </div>
      ) : undefined,
  };
}

/** "position 6.5 → 3.1", "new: position 4", "no longer shown". */
function positions(then: number | null, now: number | null): string {
  if (then === null && now === null) return "position unknown";
  if (then === null) return `new: position ${formatPosition(now!)}`;
  if (now === null) return `was position ${formatPosition(then)}, not shown now`;
  return `position ${formatPosition(then)} → ${formatPosition(now)}`;
}

function ChangeColumn({ title, pages, up }: { title: string; pages: ChangedPage[]; up: boolean }) {
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-1">
      <h3 className="flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground">
        <Icon
          className={cn("size-3.5", up ? "text-positive" : "text-negative")}
          aria-hidden="true"
        />
        {title}
      </h3>
      {pages.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">
          {up ? "No page's clicks rose by 3 or more." : "No page's clicks fell by 3 or more."}
        </p>
      ) : (
        <ul className="flex flex-col">
          {pages.map((p) => (
            <li key={p.page}>
              <details className="group/change rounded-md open:bg-muted/50">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150 hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 truncate" title={p.label}>
                    {p.label}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="text-muted-foreground">{formatNumber(p.clicksThen)} → </span>
                    <span className="font-medium">{formatNumber(p.clicksNow)}</span>
                    <span className="sr-only"> clicks</span>
                  </span>
                  <ChevronDownIcon
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/change:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="flex flex-col gap-1 px-2 pt-1 pb-2.5">
                  <p className="text-xs text-muted-foreground">
                    {positions(p.positionThen, p.positionNow)}
                  </p>
                  {p.queries.length === 0 ? (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <EyeOffIcon className="size-3.5" aria-hidden="true" />
                      The searches behind this are ones Google hides (made by very few people).
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {p.queries.map((q) => (
                        <li key={q.query} className="flex items-baseline gap-2 text-xs">
                          <span className="min-w-0 flex-1 truncate" title={q.query}>
                            “{q.query}”
                          </span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {formatNumber(q.clicksThen)} → {formatNumber(q.clicksNow)} clicks ·{" "}
                            {positions(q.positionThen, q.positionNow)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── 3. Your name vs others ─────────────────────────────────────────────────

function brandView(
  brand: Ready["brand"],
  allClicks: number,
  comparable: boolean,
  versus: string,
  settingsHref: string,
): ListView {
  const total = brand.current.brand + brand.current.other;
  const share = total > 0 ? Math.round((brand.current.other / total) * 100) : null;
  const change = (now: number, before: number) => (comparable ? percentChange(now, before) : null);
  const missing = comparable ? undefined : "Search Console keeps 16 months";
  const change_ = (
    <Link
      href={settingsHref as Route}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      change
    </Link>
  );
  return {
    value: "brand",
    label: "Your name",
    itemLabel: "Day",
    columns: ["Your name", "Others"],
    hideColumns: true,
    empty:
      brand.terms.length === 0 ? (
        <EmptyState title="We couldn't tell your site's name from its address.">
          Add how people spell it in{" "}
          <Link
            href={settingsHref as Route}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Settings
          </Link>
          , and we&apos;ll split your Google clicks.
        </EmptyState>
      ) : (
        <EmptyState title="No clicks from Google in this period." />
      ),
    rows:
      total > 0
        ? brand.days.map((d) => ({
            key: d.date,
            label: formatDay(d.date, true),
            values: [d.brand, d.other],
          }))
        : [],
    content:
      total > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Legend
              swatch="bg-chart-3"
              label="Searches with your name"
              value={brand.current.brand}
              delta={
                <Delta
                  change={change(brand.current.brand, brand.previous.brand)}
                  missing={missing}
                  versus={versus}
                  size="compact"
                />
              }
            />
            <Legend
              swatch="bg-chart-1"
              label="Other searches"
              value={brand.current.other}
              delta={
                <Delta
                  change={change(brand.current.other, brand.previous.other)}
                  missing={missing}
                  versus={versus}
                  size="compact"
                />
              }
            />
          </div>
          <StackedBars
            days={brand.days.map((d) => ({ date: d.date, a: d.brand, b: d.other }))}
            labels={["Your name", "Other searches"]}
            caption={`Google clicks per day: ${formatNumber(brand.current.brand)} from searches with your name, ${formatNumber(brand.current.other)} from other searches.`}
          />
          <Intro>
            {share !== null
              ? `${share}% of these clicks came from searches without your name. `
              : ""}
            {allClicks > total
              ? `Together they're less than your ${formatNumber(allClicks)} Google clicks, because Google leaves out searches made by very few people. `
              : ""}
            Counted as your name: {brand.terms.map((t) => `“${t}”`).join(", ")} ({change_}).
          </Intro>
        </div>
      ) : undefined,
  };
}

function Legend({
  swatch,
  label,
  value,
  delta,
}: {
  swatch: string;
  label: string;
  value: number;
  delta: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("size-2.5 shrink-0 rounded-sm", swatch)} aria-hidden="true" />
        {label}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-semibold tabular-nums">
          {formatNumber(value)}
          <span className="sr-only"> clicks</span>
        </span>
        {delta}
      </span>
    </div>
  );
}

// ── 4. Seen, not clicked ───────────────────────────────────────────────────

function unclickedView(unclicked: Ready["insights"]["unclicked"]): ListView {
  const enough = Object.keys(unclicked.groups).length > 0;
  return {
    value: "unclicked",
    label: "Seen, not clicked",
    itemLabel: "Page",
    columns: ["Seen", "Clicks", "Rate", "Position", "Your rate there"],
    cardColumns: ["Seen", "Clicks", "Rate"],
    sublabelHeader: "Compared with",
    empty: enough ? (
      <EmptyState title="No page stands out.">
        Pages Google shows often get at least half the clicks your own pages get at about the same
        position.
      </EmptyState>
    ) : (
      <EmptyState title="Not enough search data to compare your pages yet.">
        This needs at least 3 pages Google showed 200 times or more at about the same position.
      </EmptyState>
    ),
    intro: (
      <Intro>
        Pages Google showed often that got under half the clicks your own pages get at about the
        same position.
      </Intro>
    ),
    initial: 7,
    rows: unclicked.pages.map((p) => ({
      key: p.page,
      label: p.label,
      sublabel: `position ${formatPosition(p.position)} · your pages at ${p.group} get ${formatRate(p.siteRate)}`,
      values: [p.impressions, p.clicks, p.rate, p.position, p.siteRate],
      display: [null, null, formatRate(p.rate), formatPosition(p.position), formatRate(p.siteRate)],
    })),
  };
}

// ── 5. Brings signups ──────────────────────────────────────────────────────

function signupsView(data: Ready, signupEvent: string | null): ListView {
  const rows = data.landing
    ? searchesToSignups(data.insights.pages, data.landing, data.signups)
    : [];
  const searches = new Map((data.insights.pageQueries ?? []).map((p) => [p.path, p]));
  const dash = (v: number | null) => (v === null ? "—" : null);
  return {
    value: "signups",
    label: "Brings signups",
    itemLabel: "Landing page",
    columns: signupEvent ? ["Signups", "Clicks", "Visitors"] : ["Clicks", "Visitors"],
    cardColumns: signupEvent ? ["Signups", "Clicks"] : ["Clicks", "Visitors"],
    empty: data.landing ? (
      <EmptyState title="No Google clicks to your pages in this period." />
    ) : (
      <EmptyState title="Google Analytics isn't answering right now.">
        Visitors and signups from Google search show here once it does.
      </EmptyState>
    ),
    intro: (
      <Intro>
        {signupEvent
          ? "Signups from Google search visitors who landed on each page (Google Analytics), next to its Google clicks (Search Console), for the same days. Under each page, the searches that showed it most; Google doesn't say which search led to a signup."
          : "Clicks from Google (Search Console) next to that page's visitors from Google search (Google Analytics). Choose your signup event in the overview to see signups here too."}
      </Intro>
    ),
    initial: 9,
    rows: rows.map((r) => ({
      key: r.path,
      label: r.path,
      values: signupEvent
        ? [r.signups ?? 0, r.clicks, r.visitors ?? 0]
        : [r.clicks, r.visitors ?? 0],
      display: signupEvent ? [dash(r.signups), null, dash(r.visitors)] : [null, dash(r.visitors)],
    })),
    content:
      signupEvent && rows.length > 0 ? (
        <SignupPages rows={rows.map((r) => ({ ...r, page: searches.get(r.path) ?? null }))} />
      ) : undefined,
  };
}

/** Pages that fit in the card's fixed height: a page with its signups, then its top searches. */
function SignupPages({
  rows,
}: {
  rows: (ReturnType<typeof searchesToSignups>[number] & {
    page: NonNullable<Ready["insights"]["pageQueries"]>[number] | null;
  })[];
}) {
  let budget = 9;
  const shown: { row: (typeof rows)[number]; queries: PageQuery[] }[] = [];
  for (const row of rows) {
    if (budget < 1) break;
    const queries = [...(row.page?.queries ?? [])]
      .filter((q) => q.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, Math.min(2, budget - 1));
    shown.push({ row, queries });
    budget -= queries.length + 1;
  }
  return (
    <ol
      aria-label="Pages that bring signups from Google, with their searches"
      className="flex h-[calc(9*2.375rem-0.125rem)] flex-col gap-1 overflow-hidden"
    >
      {shown.map(({ row, queries }) => {
        const slipped = row.page ? slippingQuery(row.page) : null;
        return (
          <li key={row.path} className="flex flex-col">
            <div className="flex h-9 items-center gap-2 px-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium" title={row.path}>
                {row.path}
              </span>
              {slipped ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-negative">
                  <ArrowDownRightIcon className="size-3" aria-hidden="true" />
                  Slipping
                  <span className="sr-only">
                    : “{slipped.query}” went from position {formatPosition(slipped.positionThen!)}{" "}
                    to {formatPosition(slipped.position)}
                  </span>
                </span>
              ) : null}
              <span className="flex shrink-0 gap-2 tabular-nums @sm:gap-4">
                <span className="w-12 text-right @sm:w-14">
                  {row.signups === null ? "—" : formatNumber(row.signups)}
                  <span className="sr-only"> signups,</span>
                </span>
                <span className="w-12 text-right text-muted-foreground @sm:w-14">
                  {formatNumber(row.clicks)}
                  <span className="sr-only"> clicks</span>
                </span>
              </span>
            </div>
            {queries.length ? (
              <ul className="flex flex-col">
                {queries.map((q) => (
                  <li
                    key={q.query}
                    className="flex min-h-8 items-center gap-2 py-0.5 pr-2 pl-4 text-xs text-muted-foreground @md:pl-5"
                  >
                    <span className="min-w-0 flex-1 truncate" title={q.query}>
                      “{q.query}”
                    </span>
                    <span className="shrink-0 tabular-nums">
                      position {formatPosition(q.position)} · {formatNumber(q.clicks)}{" "}
                      {q.clicks === 1 ? "click" : "clicks"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
