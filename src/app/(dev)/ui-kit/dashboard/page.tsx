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
  NoPropertyNotice,
  QuotaNotice,
  RevokedNotice,
  UnavailableNotice,
} from "@/components/dashboard/states";
import { SignupChange } from "@/components/cards/signup-change";
import { ChartNotes } from "@/components/charts/chart-notes";
import { LiveCard } from "@/components/globe/live-card";
import { SignupPicker } from "@/components/cards/signup-picker";
import { EmailNotice } from "@/components/dashboard/email-notice";
import { LockedPanel } from "@/components/dashboard/locked-panel";
import { ShareCard } from "@/components/dashboard/share-card";
import { SiteChip } from "@/components/shared/site-chip";
import { Badge } from "@/components/ui/badge";
import { uiKitEnabled } from "@/lib/env";
import { comparisonGap, parseRange, rangeWindow } from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { addDays } from "@/lib/ga4/ranges";
import { sampleLive, sampleReports, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";

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
  "locked",
  "loading",
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

async function sampleShare() {
  "use server";
  return { url: "http://localhost:3000/p/yoursite-com" };
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/dashboard">, "searchParams">) {
  await connection(); // dates depend on the current time
  const params = await searchParams;
  const range = parseRange(params.range);
  const state = STATES.find((s) => s === params.state) ?? "normal";
  const window = rangeWindow(range, "Europe/Amsterdam");
  const reports = sampleReports(window, REPORTS);
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
  const zero = {
    current: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
    previous: { visitors: 0, pageViews: 0, engagementSeconds: 0 },
  };

  return (
    <>
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
        live={
          <LiveCard
            data={
              state === "no-data" ? { ...sampleLive, total: 0, places: [], pages: [] } : sampleLive
            }
            endpoint={null}
          />
        }
        site={site}
        notices={
          state === "normal" ? <EmailNotice turnOff={noop} dismiss={noop} /> : notices[state]
        }
        footer={state === "normal" ? <ShareCard action={sampleShare} /> : null}
        dimmed={state === "revoked" || state === "no-access"}
        lockedPanel={state === "locked" ? <LockedPanel upgrade={noop} /> : undefined}
      />
    </>
  );
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
