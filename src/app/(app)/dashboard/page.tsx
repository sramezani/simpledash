import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after, connection } from "next/server";
import { Suspense } from "react";
import { allowAnalyticsAccess, signInWithGoogle } from "@/app/actions/auth";
import { dismissEmailNoticeAction, setWeeklyEmailAction } from "@/app/actions/email";
import { turnOnPublicPageAction } from "@/app/actions/public-page";
import { connectSearchConsoleAction } from "@/app/actions/search-console";
import { RefreshSoon } from "@/components/dashboard/refresh-soon";
import { SearchCard } from "@/components/search/search-card";
import {
  SearchConnect,
  SearchProblemCard,
  searchProblemNote,
  SearchSkeleton,
  SearchTeaser,
} from "@/components/search/search-states";
import { loadSearch } from "@/lib/search-console/data";
import { EmailNotice } from "@/components/dashboard/email-notice";
import { ShareCard } from "@/components/dashboard/share-card";
import { getSettings } from "@/lib/email/settings";
import { getSitePublicPage } from "@/lib/public-page/public-page";
import { Notice } from "@/components/shared/notice";
import { addNoteAction, deleteNoteAction, updateNoteAction } from "@/app/actions/notes";
import { chooseSignupEvent, listMyProperties, openSite } from "@/app/actions/site";
import { plans } from "@/config/plans";
import { ChartNotes } from "@/components/charts/chart-notes";
import { LiveCard } from "@/components/globe/live-card";
import { SignupChange } from "@/components/cards/signup-change";
import { SignupPicker } from "@/components/cards/signup-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { SiteSwitcher, type SwitcherSite } from "@/components/dashboard/site-switcher";
import {
  AccessNotGranted,
  DashboardSkeleton,
  HistoryNotice,
  NoAccessNotice,
  NoDataNotice,
  NoPropertyNotice,
  QuotaNotice,
  RevokedNotice,
  UnavailableNotice,
} from "@/components/dashboard/states";
import { SampleSiteChip } from "@/components/dashboard/states";
import { getGoogleAccount } from "@/lib/auth/google";
import { hasAnalyticsScope } from "@/lib/auth/scopes";
import { requireUser } from "@/lib/auth/session";
import type { Site } from "@/lib/db/schema";
import { loadReports } from "@/lib/ga4/data";
import { getLive } from "@/lib/ga4/realtime";
import { listNotes } from "@/lib/notes/notes";
import { classifyError } from "@/lib/ga4/errors";
import { chooseFirstSite, listKeyEventNames, stillHasAccess } from "@/lib/ga4/properties";
import {
  comparisonGap,
  freeFirstDay,
  parseRange,
  rangeForPlan,
  rangeWindow,
  type RangeType,
} from "@/lib/ga4/ranges";
import { goalEvents, REPORTS, type ReportName } from "@/lib/ga4/reports";
import { paramsFor } from "@/lib/ga4/cache";
import { SalesCard } from "@/components/cards/sales-card";
import { revenueMetrics } from "@/components/dashboard/revenue-metrics";
import { getRevenueSource, loadRevenue, needsSync, syncRevenue } from "@/lib/revenue/revenue";
import { sampleReports, SAMPLE_DOMAIN, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";
import { reportError } from "@/lib/report-error";
import { getSiteContext, markSiteOpened, type SiteContext } from "@/lib/sites/sites";
import { markSiteOk } from "@/lib/sites/status";
import { settingsRoutes } from "@/lib/settings-routes";
import { readSiteId, siteProblem } from "@/lib/sites/access";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  await connection(); // date ranges depend on the current time
  const user = await requireUser();
  const params = await searchParams;
  const range = parseRange(params.range);
  const requested = readSiteId(params.site);
  const ctx = await getSiteContext(user.id, requested);
  // `?upgraded=pro` after Checkout.
  const upgraded = params.upgraded ? <UpgradedNotice /> : null;

  const account = await getGoogleAccount(user.id);
  if (!hasAnalyticsScope(account?.scope)) return <AccessNotGranted signIn={allowAnalyticsAccess} />;

  if (ctx.site) {
    return (
      <SiteDashboard
        site={ctx.site}
        ctx={ctx}
        range={range}
        extra={upgraded}
        searchResult={typeof params.search === "string" ? params.search : null}
      />
    );
  }
  // An old link to a site that left the list: open the dashboard as usual.
  if (requested) redirect("/dashboard");
  return (
    <Suspense fallback={<DashboardSkeleton message="Finding your Google Analytics site…" />}>
      <FirstVisit userId={user.id} range={range} />
    </Suspense>
  );
}

/** No site yet: pick one automatically, or show sample data when there is none. */
async function FirstVisit({ userId, range }: { userId: string; range: RangeType }) {
  let site: Site | null;
  try {
    site = await chooseFirstSite(userId);
  } catch (error) {
    const { problem } = classifyError(error);
    if (problem !== "revoked") reportError("Property choice failed", error);
    return (
      <SampleDashboard
        range={range}
        notice={
          problem === "revoked" ? (
            <RevokedNotice signIn={signInWithGoogle} />
          ) : (
            <UnavailableNotice />
          )
        }
      />
    );
  }
  if (!site) return <SampleDashboard range={range} notice={<NoPropertyNotice />} />;
  const ctx = await getSiteContext(userId, site.id);
  return <SiteDashboard site={site} ctx={ctx} range={range} extra={null} />;
}

const toSwitcherSite = (s: Site): SwitcherSite => ({
  id: s.id,
  propertyId: s.propertyId,
  label: s.domain ?? s.displayName,
  domain: s.domain,
  problem: siteProblem(s.status),
});

/** The site menu (docs/SPEC.md section 28.1), from the request's site context. */
function Switcher({ site, ctx, range }: { site: Site; ctx: SiteContext; range: string | null }) {
  const sites = ctx.sites.some((s) => s.id === site.id) ? ctx.sites : [site, ...ctx.sites];
  return (
    <SiteSwitcher
      current={toSwitcherSite(site)}
      sites={sites.map(toSwitcherSite)}
      range={range}
      listAction={listMyProperties}
      openAction={openSite}
      reconnect={signInWithGoogle}
    />
  );
}

async function SiteDashboard({
  site: initial,
  ctx,
  range: requestedRange,
  extra,
  searchResult = null,
}: {
  site: Site;
  ctx: SiteContext;
  range: RangeType;
  extra: React.ReactNode;
  /** `?search=` after connecting Search Console: "connected", "no_match", "denied"… */
  searchResult?: string | null;
}) {
  let site = initial;
  // This site is now the one the dashboard opens with, and warm-cache keeps it fresh.
  after(() => markSiteOpened(initial));
  // Lost access earlier? Check again, so the banner clears on its own when access is back.
  if (site.status === "no_access") {
    const back = await stillHasAccess(site.userId, site.propertyId).catch(() => false);
    if (back) {
      await markSiteOk(site.id);
      site = { ...site, status: "ok" };
    }
  }

  // One clock for the reports and the notes, so both cover the same days.
  const now = new Date();
  // Free sees the last 30 days: a longer range (an old link) shows Last 30 days instead.
  const { range, limited } = rangeForPlan(requestedRange, ctx.ent.fullHistory, site.timeZone, now);
  const window = rangeWindow(range, site.timeZone, now);
  const proRevenue = ctx.ent.revenue;
  const [result, notes, settings, publicPage, revenue] = await Promise.all([
    loadReports(site, range, REPORTS, { now }),
    listNotes(site.id, window.current.start, window.current.end),
    getSettings(site.userId),
    getSitePublicPage(site.id),
    proRevenue ? loadRevenue(site, window).catch(() => null) : null,
  ]);
  if (proRevenue) {
    // Stripe totals older than an hour are brought up to date after the response.
    after(async () => {
      const source = await getRevenueSource(site.id);
      if (source && needsSync(source)) await syncRevenue(site, source).catch(() => undefined);
    });
  }
  const label = site.domain ?? site.displayName;
  const totals = result.reports.totals.data;
  const anyData = REPORTS.some((r) => result.reports[r].data);
  const switcher = <Switcher site={site} ctx={ctx} range={range === "7d" ? null : range} />;
  const signupAction = chooseSignupEvent.bind(null, site.id);

  let notice = null;
  if (result.problem === "revoked") notice = <RevokedNotice signIn={signInWithGoogle} />;
  else if (result.problem === "no_access") notice = <NoAccessNotice switcher={switcher} />;
  else if (result.problem === "quota")
    notice = <QuotaNotice until={result.quotaUntil} timeZone={site.timeZone} cached={anyData} />;
  else if (result.problem && !anyData) notice = <UnavailableNotice />;
  else if (totals && totals.current.visitors === 0 && totals.previous.visitors === 0)
    notice = <NoDataNotice site={label} />;

  // Sites that can't reach Google (access ended or lost) don't ask it for key events either.
  const picker =
    site.status === "ok" ? (
      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <SignupPickerLoader site={site} action={signupAction} />
      </Suspense>
    ) : (
      <SignupPicker keyEvents={null} current={site.signupEvent} action={signupAction} />
    );
  const signupPicker = site.signupEvent ? <SignupChange picker={picker} /> : picker;

  const fetchedAt = REPORTS.map((r) => result.reports[r].fetchedAt?.getTime() ?? 0).join(".");

  return (
    <DashboardView
      range={range}
      window={result.window}
      reports={result.reports}
      signupEvent={site.signupEvent}
      comparisonGap={comparisonGap(result.window, site.propertyCreatedAt)}
      site={switcher}
      siteId={site.id}
      siteName={label}
      historyLimit={
        ctx.ent.fullHistory
          ? null
          : { firstDay: freeFirstDay(result.window.today), upgradeHref: settingsRoutes.billing }
      }
      notices={
        <>
          {extra}
          {limited ? <HistoryNotice /> : null}
          {notice}
          {ctx.ent.weeklyEmail && settings.weeklyEmail && !settings.emailNoticeDismissed ? (
            <EmailNotice turnOff={setWeeklyEmailAction} dismiss={dismissEmailNoticeAction} />
          ) : null}
        </>
      }
      footer={
        !publicPage && site.status === "ok" ? (
          <ShareCard
            action={turnOnPublicPageAction.bind(null, site.id)}
            settingsHref={settingsRoutes.site(site.id, "public")}
          />
        ) : null
      }
      signupPicker={signupPicker}
      notes={notes}
      notesPanel={
        <ChartNotes
          notes={notes}
          min={result.window.current.start}
          max={result.window.current.end}
          add={addNoteAction.bind(null, site.id)}
          update={updateNoteAction.bind(null, site.id)}
          remove={deleteNoteAction.bind(null, site.id)}
        />
      }
      live={
        site.status === "ok" && result.problem !== "revoked" && result.problem !== "no_access" ? (
          <Suspense fallback={<LiveCard data={null} endpoint={null} loading />}>
            <LiveLoader site={site} />
          </Suspense>
        ) : null
      }
      csv
      ownerTips
      extraMetrics={
        revenue
          ? revenueMetrics({
              view: revenue,
              visitors: totals?.current.visitors ?? null,
              comparable: comparisonGap(result.window, site.propertyCreatedAt) === null,
              settingsHref: settingsRoutes.site(site.id, "revenue"),
            })
          : undefined
      }
      revenueByDay={revenue?.kind === "ready" ? revenue.current.byDay : undefined}
      revenueCurrency={revenue?.kind === "ready" ? revenue.current.currency : undefined}
      sales={
        proRevenue && site.status !== "needs_reconnect" ? (
          <Suspense fallback={<Skeleton className="h-[30rem] rounded-2xl" />}>
            <SalesLoader site={site} range={range} />
          </Suspense>
        ) : null
      }
      search={
        site.status === "needs_reconnect" ? null : (
          <SearchSection site={site} ctx={ctx} range={range} result={searchResult} />
        )
      }
      dimmed={result.problem === "revoked" || result.problem === "no_access"}
      refreshToken={result.refreshing ? fetchedAt : null}
    />
  );
}

/**
 * The Google search card (docs/SPEC.md section 28.2): Pro with Search Console sees it,
 * streamed on its own; Pro without sees "Connect"; Free sees the teaser.
 */
function SearchSection({
  site,
  ctx,
  range,
  result,
}: {
  site: Site;
  ctx: SiteContext;
  range: RangeType;
  result: string | null;
}) {
  const settingsHref = settingsRoutes.site(site.id, "search");
  if (!ctx.ent.searchConsole) return <SearchTeaser href={settingsHref} />;
  const connect = connectSearchConsoleAction.bind(null, site.id, "dashboard");
  if (!site.searchConsoleUrl) {
    return (
      <div className="flex flex-col gap-3">
        {result === "no_match" ? (
          <Notice
            tone="warning"
            title={`Search Console is connected, but none of your properties is ${site.domain ?? site.displayName}.`}
          >
            Pick one in{" "}
            <Link
              href={settingsHref as Route}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Settings
            </Link>
            , or add the site in Search Console first.
          </Notice>
        ) : result === "denied" ? (
          <Notice tone="warning" title="Search Console access wasn't granted.">
            Use the Google account you sign in with, and tick the Search Console box on
            Google&apos;s screen.
          </Notice>
        ) : null}
        <SearchConnect connect={connect} />
      </div>
    );
  }
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchLoader site={site} range={range} connect={connect} settingsHref={settingsHref} />
    </Suspense>
  );
}

async function SearchLoader({
  site,
  range,
  connect,
  settingsHref,
}: {
  site: Site;
  range: RangeType;
  connect: (formData: FormData) => Promise<void>;
  settingsHref: string;
}) {
  const data = await loadSearch(site, range).catch((error) => {
    reportError("Google search card failed", error, { propertyId: site.propertyId });
    return { kind: "error", problem: "unavailable" } as const;
  });
  if (data.kind === "not_connected") return <SearchConnect connect={connect} />;
  if (data.kind === "error") {
    return (
      <SearchProblemCard problem={data.problem} connect={connect} settingsHref={settingsHref} />
    );
  }
  return (
    <>
      <SearchCard
        data={data}
        siteName={site.domain ?? site.displayName}
        signupEvent={site.signupEvent}
        settingsHref={settingsHref}
        note={searchProblemNote(data.problem)}
      />
      {data.refreshing ? <RefreshSoon token={`search-${data.window.current.end}`} /> : null}
    </>
  );
}

/** Sales and signups by source (docs/SPEC.md section 28.3), streamed on its own. */
async function SalesLoader({ site, range }: { site: Site; range: RangeType }) {
  const goals = goalEvents(paramsFor(site)).length > 0;
  const names: ReportName[] = [
    "sources",
    "landing",
    ...(goals ? (["goals_sources", "goals_landing"] as const) : []),
    ...(site.salePage ? (["sale_page_sources", "sale_page_landing"] as const) : []),
    "purchase_sources",
    "purchase_landing",
  ];
  const result = await loadReports(site, range, names).catch(() => null);
  if (!result) return null;
  const r = result.reports;
  return (
    <SalesCard
      data={{
        sources: r.sources?.data ?? null,
        landing: r.landing?.data ?? null,
        goalsSources: r.goals_sources?.data ?? null,
        goalsLanding: r.goals_landing?.data ?? null,
        pageSources: r.sale_page_sources?.data ?? null,
        pageLanding: r.sale_page_landing?.data ?? null,
        purchaseSources: r.purchase_sources?.data ?? null,
        purchaseLanding: r.purchase_landing?.data ?? null,
      }}
      signupEvent={site.signupEvent}
      saleEvent={site.saleEvent}
      salePage={site.salePage}
      currency={site.currencyCode}
      exportInfo={{ site: site.domain ?? site.displayName, ...result.window.current }}
      settingsHref={settingsRoutes.site(site.id, "sales")}
    />
  );
}

async function LiveLoader({ site }: { site: Site }) {
  const data = await getLive(site).catch(() => null);
  return <LiveCard data={data} endpoint={`/api/live?site=${site.id}`} />;
}

async function SignupPickerLoader({
  site,
  action,
}: {
  site: Site;
  action: React.ComponentProps<typeof SignupPicker>["action"];
}) {
  const keyEvents = await listKeyEventNames(site.userId, site.propertyId).catch(() => null);
  return <SignupPicker keyEvents={keyEvents} current={site.signupEvent} action={action} />;
}

function SampleDashboard({ range, notice }: { range: RangeType; notice: React.ReactNode }) {
  const window = rangeWindow(range, "UTC");
  return (
    <DashboardView
      range={range}
      window={window}
      reports={sampleReports(window, REPORTS)}
      signupEvent={SAMPLE_SIGNUP_EVENT}
      comparisonGap={comparisonGap(window, null)}
      site={<SampleSiteChip />}
      siteName={SAMPLE_DOMAIN}
      notices={notice}
    />
  );
}

function UpgradedNotice() {
  return (
    <Notice title={`Thank you! ${plans.pro.name} is active.`}>
      It can take a minute for Stripe to confirm. You&apos;ll find the plan and invoices in
      Settings.
    </Notice>
  );
}
