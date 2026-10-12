import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { signInWithGoogle } from "@/app/actions/auth";
import { upgrade } from "@/app/actions/billing";
import { dismissEmailNoticeAction, setWeeklyEmailAction } from "@/app/actions/email";
import { turnOnPublicPageAction } from "@/app/actions/public-page";
import { EmailNotice } from "@/components/dashboard/email-notice";
import { ShareCard } from "@/components/dashboard/share-card";
import { getSettings } from "@/lib/email/settings";
import { getMyPublicPage } from "@/lib/public-page/public-page";
import { LockedPanel } from "@/components/dashboard/locked-panel";
import { Notice } from "@/components/shared/notice";
import { getPlan } from "@/lib/billing/billing";
import { isLocked } from "@/lib/billing/plan";
import { addNoteAction, deleteNoteAction, updateNoteAction } from "@/app/actions/notes";
import { chooseSignupEvent, listMyProperties, switchSite } from "@/app/actions/site";
import { ChartNotes } from "@/components/charts/chart-notes";
import { LiveCard } from "@/components/globe/live-card";
import { SignupChange } from "@/components/cards/signup-change";
import { SignupPicker } from "@/components/cards/signup-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { SiteSwitcher } from "@/components/dashboard/site-switcher";
import {
  AccessNotGranted,
  DashboardSkeleton,
  NoAccessNotice,
  NoDataNotice,
  NoPropertyNotice,
  QuotaNotice,
  RevokedNotice,
  UnavailableNotice,
} from "@/components/dashboard/states";
import { Badge } from "@/components/ui/badge";
import { getGoogleAccount } from "@/lib/auth/google";
import { hasAnalyticsScope } from "@/lib/auth/scopes";
import { getActiveSite, requireUser } from "@/lib/auth/session";
import type { Site } from "@/lib/db/schema";
import { loadReports } from "@/lib/ga4/data";
import { getLive } from "@/lib/ga4/realtime";
import { listNotes } from "@/lib/notes/notes";
import { classifyError } from "@/lib/ga4/errors";
import { chooseFirstSite, listKeyEventNames, stillHasAccess } from "@/lib/ga4/properties";
import { lacksHistory, parseRange, rangeWindow, type RangeType } from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { sampleReports, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";
import { reportError } from "@/lib/report-error";
import { markSiteOk } from "@/lib/sites";

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
  const locked = isLocked(await getPlan(user.id));
  const upgraded = params.upgraded === "1" ? <UpgradedNotice /> : null;

  const account = await getGoogleAccount(user.id);
  if (!hasAnalyticsScope(account?.scope)) return <AccessNotGranted signIn={signInWithGoogle} />;

  const site = await getActiveSite(user.id);
  if (site) return <SiteDashboard site={site} range={range} locked={locked} extra={upgraded} />;
  // A locked account doesn't call Google, so no property is looked up.
  if (locked) return <SampleDashboard range={range} notice={null} locked />;
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
  return <SiteDashboard site={site} range={range} locked={false} extra={null} />;
}

function Switcher({ site }: { site: Site }) {
  return (
    <SiteSwitcher
      label={site.domain ?? site.displayName}
      currentPropertyId={site.propertyId}
      listAction={listMyProperties}
      switchAction={switchSite}
    />
  );
}

async function SiteDashboard({
  site: initial,
  range,
  locked,
  extra,
}: {
  site: Site;
  range: RangeType;
  locked: boolean;
  extra: React.ReactNode;
}) {
  let site = initial;
  // Lost access earlier? Check again, so the banner clears on its own when access is back.
  if (site.status === "no_access" && !locked) {
    const back = await stillHasAccess(site.userId, site.propertyId).catch(() => false);
    if (back) {
      await markSiteOk(site.id);
      site = { ...site, status: "ok" };
    }
  }

  // One clock for the reports and the notes, so both cover the same days.
  const now = new Date();
  const window = rangeWindow(range, site.timeZone, now);
  const [result, notes, settings, publicPage] = await Promise.all([
    loadReports(site, range, REPORTS, { now, cacheOnly: locked }),
    listNotes(site.id, window.current.start, window.current.end),
    getSettings(site.userId),
    getMyPublicPage(site.userId),
  ]);
  const label = site.domain ?? site.displayName;
  const totals = result.reports.totals.data;
  const anyData = REPORTS.some((r) => result.reports[r].data);
  const switcher = <Switcher site={site} />;

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
    site.status === "ok" && !locked ? (
      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <SignupPickerLoader site={site} />
      </Suspense>
    ) : (
      <SignupPicker keyEvents={null} current={site.signupEvent} action={chooseSignupEvent} />
    );
  const signupPicker = site.signupEvent ? <SignupChange picker={picker} /> : picker;

  const fetchedAt = REPORTS.map((r) => result.reports[r].fetchedAt?.getTime() ?? 0).join(".");

  return (
    <DashboardView
      range={range}
      window={result.window}
      reports={result.reports}
      signupEvent={site.signupEvent}
      comparable={!lacksHistory(result.window, site.propertyCreatedAt)}
      site={switcher}
      notices={
        <>
          {extra}
          {notice}
          {settings.weeklyEmail && !settings.emailNoticeDismissed && !locked ? (
            <EmailNotice turnOff={setWeeklyEmailAction} dismiss={dismissEmailNoticeAction} />
          ) : null}
        </>
      }
      footer={
        !publicPage && !locked && site.status === "ok" ? (
          <ShareCard action={turnOnPublicPageAction} />
        ) : null
      }
      signupPicker={signupPicker}
      notes={notes}
      notesPanel={
        <ChartNotes
          notes={notes}
          min={result.window.current.start}
          max={result.window.current.end}
          add={addNoteAction}
          update={updateNoteAction}
          remove={deleteNoteAction}
        />
      }
      live={
        site.status === "ok" &&
        !locked &&
        result.problem !== "revoked" &&
        result.problem !== "no_access" ? (
          <Suspense fallback={<LiveCard data={null} endpoint={null} loading />}>
            <LiveLoader site={site} />
          </Suspense>
        ) : null
      }
      csv
      lockedPanel={locked ? <LockedPanel upgrade={upgrade} /> : undefined}
      dimmed={result.problem === "revoked" || result.problem === "no_access"}
      refreshToken={result.refreshing ? fetchedAt : null}
    />
  );
}

async function LiveLoader({ site }: { site: Site }) {
  const data = await getLive(site).catch(() => null);
  return <LiveCard data={data} endpoint="/api/live" />;
}

async function SignupPickerLoader({ site }: { site: Site }) {
  const keyEvents = await listKeyEventNames(site.userId, site.propertyId).catch(() => null);
  return (
    <SignupPicker keyEvents={keyEvents} current={site.signupEvent} action={chooseSignupEvent} />
  );
}

function SampleDashboard({
  range,
  notice,
  locked,
}: {
  range: RangeType;
  notice: React.ReactNode;
  locked?: boolean;
}) {
  const window = rangeWindow(range, "UTC");
  return (
    <DashboardView
      range={range}
      window={window}
      reports={sampleReports(window, REPORTS)}
      signupEvent={SAMPLE_SIGNUP_EVENT}
      comparable
      site={<Badge variant="outline">Sample data</Badge>}
      notices={notice}
      lockedPanel={locked ? <LockedPanel upgrade={upgrade} /> : undefined}
    />
  );
}

function UpgradedNotice() {
  return (
    <Notice title="Thank you! Your Starter plan is active.">
      It can take a minute for Stripe to confirm. You&apos;ll find the plan and invoices in
      Settings.
    </Notice>
  );
}
