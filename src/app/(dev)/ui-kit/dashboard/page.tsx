import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import {
  AccessNotGranted,
  DashboardSkeleton,
  NoAccessNotice,
  NoDataNotice,
  HistoryNotice,
  NoPropertyNotice,
  QuotaNotice,
  RevokedNotice,
  UnavailableNotice,
} from "@/components/dashboard/states";
import { SignupChange } from "@/components/cards/signup-change";
import { ChartNotes } from "@/components/charts/chart-notes";
import { LiveButton } from "@/components/globe/live-button";
import { SignupPicker } from "@/components/cards/signup-picker";
import { EmailNotice } from "@/components/dashboard/email-notice";
import { ShareCard } from "@/components/dashboard/share-card";
import { SiteSwitcher } from "@/components/dashboard/site-switcher";
import { SearchCard } from "@/components/search/search-card";
import { SearchConnect, SearchProblemCard, SearchTeaser } from "@/components/search/search-states";
import { sampleSearchCard, sampleWeeklyPick } from "@/lib/search-console/sample";
import { SearchActionPanel } from "@/components/search/search-action";
import type { PropertyList } from "@/lib/ga4/property-choice";
import { SiteChip } from "@/components/shared/site-chip";
import { Badge } from "@/components/ui/badge";
import { uiKitEnabled } from "@/lib/env";
import {
  comparisonGap,
  freeFirstDay,
  parseRange,
  previousPeriodWords,
  rangeForPlan,
  rangeWindow,
} from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { addDays } from "@/lib/ga4/ranges";
import {
  sampleLive,
  sampleReports,
  SAMPLE_SALE_EVENT,
  SAMPLE_SIGNUP_EVENT,
} from "@/lib/ga4/sample/sample";
import { SalesCard } from "@/components/cards/sales-card";
import { WhatChangedCard } from "@/components/cards/what-changed-card";
import { SendEvents } from "@/components/dashboard/analytics-events";
import { AUTH_PARAM, authEvent } from "@/lib/analytics/events";
import { metricChanges } from "@/lib/changes/breakdown";
import { formatDayRange } from "@/lib/format";
import { revenueMetrics } from "@/components/dashboard/revenue-metrics";
import { sampleRevenue } from "@/lib/revenue/sample";

export const metadata: Metadata = {
  title: "Dashboard preview",
  robots: { index: false, follow: false },
};

const STATES = [
  "normal",
  "no-property",
  "no-data",
  "no-signup-event",
  "no-history",
  "no-key-events",
  "small-site",
  "revoked",
  "no-access",
  "quota",
  "quota-empty",
  "unavailable",
  "not-granted",
  "loading",
  "pro",
  "free-menu",
  "free-history",
  "search-connect",
  "search-error",
  "search-done",
] as const;

/** Dev only: the real dashboard on sample data, in every state, without signing in. */
export default function DashboardPreviewPage({ searchParams }: PageProps<"/ui-kit/dashboard">) {
  if (!uiKitEnabled) notFound();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

/** The preview's buttons do nothing. */
async function noop() {
  "use server";
}

async function noopNote() {
  "use server";
  return { saved: true };
}

async function noopPick() {
  "use server";
  return { saved: true };
}

async function noopDone() {
  "use server";
  return { done: true };
}

async function sampleShare() {
  "use server";
  return { url: "http://localhost:3000/p/yoursite-com" };
}

/** The site menu's list in the preview: a Google account with two Analytics accounts. */
async function sampleProperties(): Promise<PropertyList> {
  "use server";
  await new Promise((r) => setTimeout(r, 400));
  return {
    properties: [
      { propertyId: "properties/101", displayName: "yoursite.com", account: "Your company" },
      { propertyId: "properties/102", displayName: "Blog", account: "Your company" },
      { propertyId: "properties/103", displayName: "Docs", account: "Your company" },
      { propertyId: "properties/104", displayName: "Landing page test", account: "Your company" },
      { propertyId: "properties/201", displayName: "Side project", account: "Personal" },
      { propertyId: "properties/202", displayName: "São Paulo café", account: "Personal" },
    ],
  };
}

async function previewOpen() {
  "use server";
  return { error: "This is a preview: nothing was opened." };
}

/** The sample site with nobody on it: what the live view says in a quiet moment. */
const quietLive = {
  ...sampleLive,
  total: 0,
  places: [],
  pages: [],
  devices: [],
  perMinute: sampleLive.perMinute.map(() => 0),
  events: {},
};

const PREVIEW_SITES = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    propertyId: "properties/101",
    label: "yoursite.com",
    domain: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    propertyId: "properties/102",
    label: "blog.yoursite.com",
    domain: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    propertyId: "properties/103",
    label: "docs.yoursite.com",
    domain: null,
  },
];

/** The real site menu, on sample sites: three of the user's sites (Pro), or one (Free). */
function PreviewSwitcher({ pro, range }: { pro: boolean; range: string }) {
  const sites = PREVIEW_SITES.slice(0, pro ? 3 : 1).map((s, i) => ({
    ...s,
    problem: i === 2 ? "Google access ended" : null,
  }));
  return (
    <SiteSwitcher
      current={sites[0]!}
      sites={sites}
      range={range === "7d" ? null : range}
      listAction={sampleProperties}
      openAction={previewOpen}
      dashboardPath="/ui-kit/dashboard"
      settingsPath={`/ui-kit/settings?state=${pro ? "pro" : "free"}&site=`}
    />
  );
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/dashboard">, "searchParams">) {
  await connection(); // dates depend on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "normal";
  const pro = state === "pro" || state === "search-done";
  // Free (every state but "pro") sees the last 30 days, like the real dashboard.
  const { range, limited } = rangeForPlan(
    state === "free-history" ? "12m" : parseRange(params.range),
    pro,
    "Europe/Amsterdam",
  );
  const window = rangeWindow(range, "Europe/Amsterdam");
  const reports = sampleReports(window, REPORTS);
  const extra = sampleReports(window, [
    "goals_sources",
    "goals_landing",
    "purchase_sources",
    "purchase_landing",
    "first_goals",
    "first_purchase",
    "goal_paths",
    "goal_days",
  ]);
  // A payment page among the sources, to show the owner's warning.
  if (pro) {
    reports.sources.data = {
      rows: [
        ...reports.sources.data.rows,
        { source: "checkout.stripe.com", label: "checkout.stripe.com", visitors: 14, previous: 9 },
      ],
    };
  }
  const site = (
    <SiteChip domain={null} label="yoursite.com">
      <Badge variant="secondary">Preview</Badge>
    </SiteChip>
  );
  const quotaUntil = new Date(`${window.today}T15:00:00Z`);

  if (state === "not-granted") return <AccessNotGranted signIn={noop} />;
  if (state === "loading")
    return <DashboardSkeleton message="Finding your Google Analytics site…" />;

  const notices: Partial<Record<(typeof STATES)[number], ReactNode>> = {
    "no-property": <NoPropertyNotice />,
    "no-data": <NoDataNotice site="yoursite.com" />,
    revoked: <RevokedNotice signIn={noop} />,
    "no-access": <NoAccessNotice switcher={site} />,
    quota: <QuotaNotice until={quotaUntil} timeZone="Europe/Amsterdam" cached />,
    "quota-empty": <QuotaNotice until={quotaUntil} timeZone="Europe/Amsterdam" cached={false} />,
    unavailable: <UnavailableNotice />,
    "free-history": <HistoryNotice href="/ui-kit/settings?page=billing" />,
  };

  const empty = state === "quota-empty" || state === "unavailable";
  const keyEvents = state === "no-key-events" ? [] : ["purchase", "sign_up", "trial_started"];
  const picker = (
    <SignupPicker
      keyEvents={keyEvents}
      current={state.startsWith("no-") ? null : SAMPLE_SIGNUP_EVENT}
      action={noopPick}
    />
  );
  const signupEvent =
    state === "no-signup-event" || state === "no-key-events" ? null : SAMPLE_SIGNUP_EVENT;
  const previewNotes =
    state === "normal"
      ? [
          {
            id: "00000000-0000-4000-8000-000000000001",
            day: addDays(window.current.end, -3),
            text: "Launched on Product Hunt",
          },
        ]
      : [];
  const searchData = sampleSearchCard(window.current, { signupEvent });
  const changeReports = sampleReports(window, ["change_paths", "change_goals"]);
  const changes =
    empty || state === "no-data" || state === "revoked" ? null : (
      <WhatChangedCard
        metrics={metricChanges(
          {
            totals: reports.totals.data,
            sources: reports.sources.data,
            actions: reports.actions.data,
            paths: changeReports.change_paths.data,
            goals: changeReports.change_goals.data,
            salePageCells: null,
          },
          {
            signupEvent,
            saleEvent: SAMPLE_SALE_EVENT,
            salePage: null,
            pro,
            search: pro ? searchData.insights.changed : null,
          },
        )}
        versus={`vs ${previousPeriodWords(range)}`}
        missing={state === "no-history" ? "Not enough history to compare" : null}
        exportInfo={{ site: "yoursite.com", ...window.current }}
        searchDays={
          pro
            ? formatDayRange(
                searchData.insightsWindow.current.start,
                searchData.insightsWindow.current.end,
              )
            : null
        }
        footer={
          pro || !signupEvent ? null : (
            <p className="pb-2 text-xs text-muted-foreground">
              Pro also shows what moved your signups and sales.{" "}
              <Link
                href="/ui-kit/settings?page=billing"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                See Pro
              </Link>
            </p>
          )
        }
      />
    );
  const zero = {
    current: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
    previous: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
  };

  // `?auth=signup|login` previews the sign-in events (written to the console in development).
  const signedIn = authEvent(params[AUTH_PARAM]);

  return (
    <>
      <SendEvents events={signedIn ? [signedIn] : []} clearParams={[AUTH_PARAM]} />
      <PreviewNav state={state} range={range} />
      <DashboardView
        basePath="/ui-kit/dashboard"
        range={range}
        window={window}
        reports={
          empty
            ? {}
            : state === "no-data"
              ? { ...reports, totals: { data: zero } }
              : state === "small-site"
                ? smallSite(reports)
                : reports
        }
        signupEvent={signupEvent}
        signupPicker={signupEvent ? <SignupChange picker={picker} /> : picker}
        comparisonGap={
          state === "no-history" ? "Not enough history to compare" : comparisonGap(window, null)
        }
        query={state === "normal" ? undefined : { state }}
        historyLimit={
          pro
            ? null
            : { firstDay: freeFirstDay(window.today), upgradeHref: "/ui-kit/settings?page=billing" }
        }
        notes={previewNotes}
        notesPanel={
          <ChartNotes
            notes={previewNotes}
            min={window.current.start}
            max={window.current.end}
            add={noopNote}
            update={noopNote}
            remove={noopNote}
          />
        }
        changes={changes}
        live={
          <LiveButton
            endpoint={null}
            sample={state === "no-data" ? quietLive : sampleLive}
            siteName="yoursite.com"
            signupEvent={SAMPLE_SIGNUP_EVENT}
          />
        }
        site={pro || state === "free-menu" ? <PreviewSwitcher pro={pro} range={range} /> : site}
        siteName="yoursite.com"
        notices={
          pro ? (
            <EmailNotice turnOff={noop} dismiss={noop} />
          ) : limited ? (
            notices["free-history"]
          ) : (
            notices[state]
          )
        }
        footer={state === "normal" ? <ShareCard action={sampleShare} /> : null}
        ownerTips
        extraMetrics={
          pro
            ? revenueMetrics({
                view: sampleRevenue(window),
                visitors: reports.totals.data.current.visitors,
                comparable: true,
                settingsHref: "/ui-kit/settings?state=pro&page=site#revenue",
              })
            : undefined
        }
        revenueByDay={pro ? proRevenue(window).byDay : undefined}
        revenueCurrency={pro ? "EUR" : undefined}
        sales={
          pro ? (
            <SalesCard
              data={{
                sources: reports.sources.data,
                landing: reports.landing.data,
                goalsSources: extra.goals_sources.data,
                goalsLanding: extra.goals_landing.data,
                pageSources: null,
                pageLanding: null,
                purchaseSources: extra.purchase_sources.data,
                purchaseLanding: extra.purchase_landing.data,
                firstGoals: extra.first_goals.data,
                firstPages: null,
                firstPurchase: extra.first_purchase.data,
                goalPaths: extra.goal_paths.data,
                pagePaths: null,
                goalDays: extra.goal_days.data,
                pageDays: null,
              }}
              signupEvent={SAMPLE_SIGNUP_EVENT}
              saleEvent={SAMPLE_SALE_EVENT}
              salePage={null}
              currency="EUR"
              exportInfo={{ site: "yoursite.com", ...window.current }}
              settingsHref="/ui-kit/settings?state=pro&page=site#sales"
            />
          ) : null
        }
        search={
          pro ? (
            <SearchCard
              data={searchData}
              action={
                <SearchActionPanel
                  pick={sampleWeeklyPick(window.current, {
                    signupEvent,
                    done: state === "search-done",
                  })}
                  markDone={noopDone}
                  signupEvent={signupEvent}
                />
              }
              siteName="yoursite.com"
              signupEvent={signupEvent}
              settingsHref="/ui-kit/settings?state=pro&page=site#search"
            />
          ) : state === "search-connect" ? (
            <SearchConnect connect={noop} />
          ) : state === "search-error" ? (
            <SearchProblemCard problem="scope" connect={noop} settingsHref="/ui-kit/settings" />
          ) : state === "normal" || state === "free-menu" || state === "free-history" ? (
            <SearchTeaser href="/ui-kit/settings?page=site#search" />
          ) : null
        }
        dimmed={state === "revoked" || state === "no-access"}
      />
    </>
  );
}

function PreviewNav({ state, range }: { state: string; range: string }) {
  return (
    <nav
      aria-label="Preview states"
      className="flex flex-wrap gap-1 border-b bg-muted px-4 py-2 text-xs"
    >
      {STATES.map((s) => (
        <Link
          key={s}
          href={{ pathname: "/ui-kit/dashboard", query: { state: s, range } }}
          aria-current={s === state ? "page" : undefined}
          className="rounded-md px-2 py-1 aria-[current=page]:bg-card aria-[current=page]:font-medium"
        >
          {s}
        </Link>
      ))}
    </nav>
  );
}

/** The sample revenue's current period, for the bars. */
function proRevenue(window: {
  current: { start: string; end: string };
  previous: { start: string; end: string };
}) {
  const view = sampleRevenue(window);
  if (view.kind !== "ready") throw new Error("sample revenue is always ready");
  return view.current;
}

/** The sample site at about 1/40 of its size, to see how the chart reads on a small site. */
function smallSite(reports: ReturnType<typeof sampleReports<(typeof REPORTS)[number]>>) {
  const series = reports.series.data;
  return {
    ...reports,
    series: {
      data: {
        ...series,
        points: series.points.map((p, i) => ({
          key: p.key,
          visitors: Math.round(p.visitors / 40 + ((i * 7) % 3 === 0 ? 0.6 : 0)),
        })),
      },
    },
  };
}
