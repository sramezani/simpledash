import { LockKeyholeIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { GoogleButton } from "@/components/shared/google-button";
import { Logo, LogoMark } from "@/components/shared/logo";
import { SiteChip } from "@/components/shared/site-chip";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_DOMAIN } from "@/lib/ga4/sample/sample";
import { Notice } from "@/components/shared/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/format";

/** The dashboard's states (docs/SPEC.md section 12): plain copy and one action each. */

type SignInAction = () => Promise<void>;

function ReconnectForm({ action, label }: { action: SignInAction; label: string }) {
  return (
    <form action={action}>
      <GoogleButton>{label}</GoogleButton>
    </form>
  );
}

export function NoPropertyNotice() {
  return (
    <Notice
      title="No Google Analytics site found. Here's how to add GA4 in 5 minutes."
      action={
        <a
          href="https://support.google.com/analytics/answer/9304153"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center rounded-lg border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Google&apos;s setup guide
        </a>
      }
    >
      <ol className="mt-1 list-decimal space-y-1 pl-5">
        <li>In Google Analytics, create an account and a GA4 property for your site.</li>
        <li>Add a web data stream with your site&apos;s address.</li>
        <li>Add the Google tag to your site (most site builders have a field for it).</li>
      </ol>
      <p className="mt-2">
        Until then, this is sample data. Sign in again once GA4 is set up and we&apos;ll pick it up.
      </p>
    </Notice>
  );
}

export function NoDataNotice({ site }: { site: string }) {
  return (
    <Notice title={`Google Analytics hasn't recorded any visits for ${site} in this period.`}>
      If you just added it, check back tomorrow.
    </Notice>
  );
}

export function RevokedNotice({ signIn }: { signIn: SignInAction }) {
  return (
    <Notice
      tone="warning"
      title="Google access ended. Reconnect to see fresh numbers."
      action={<ReconnectForm action={signIn} label="Reconnect Google" />}
    >
      The numbers below are the last ones we had.
    </Notice>
  );
}

export function NoAccessNotice({ switcher }: { switcher: ReactNode }) {
  return (
    <Notice
      tone="warning"
      title="You no longer have access to this Google Analytics site."
      action={switcher}
    >
      Pick another site, or ask the site&apos;s owner to add your Google account again.
    </Notice>
  );
}

export function UnavailableNotice() {
  return (
    <Notice tone="warning" title="Google Analytics isn't answering right now.">
      We&apos;ll try again in a moment. Refresh the page in a few minutes.
    </Notice>
  );
}

function quotaText(until: Date | null, timeZone: string) {
  const when = until ? ` Numbers refresh after ${formatTime(until, timeZone)}.` : "";
  return `Google's hourly limit for this site was reached.${when}`;
}

/** Google's quota: shown once above the cards, which keep their cached numbers. */
export function QuotaNotice({
  until,
  timeZone,
  cached,
}: {
  until: Date | null;
  timeZone: string;
  cached: boolean;
}) {
  return (
    <Notice tone="warning" title={quotaText(until, timeZone)}>
      {cached ? "The numbers below are the latest we have." : null}
    </Notice>
  );
}

/** The Analytics scope was unticked on Google's consent screen. */
export function AccessNotGranted({ signIn }: { signIn: SignInAction }) {
  return (
    <DashboardFrame>
      <div className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-xl border bg-card p-6">
        <LockKeyholeIcon className="size-6 text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold tracking-tight">
          SimpleDash needs read-only access to Google Analytics.
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          On Google&apos;s screen, the Analytics box was left unticked. Allow read-only access and
          we&apos;ll show your numbers. We can&apos;t change anything in your account.
        </p>
        <ReconnectForm action={signIn} label="Allow access" />
      </div>
    </DashboardFrame>
  );
}

/** A page frame with the logo and optional navigation, for settings and full-page states. */
export function DashboardFrame({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  return (
    <>
      <header className="border-b bg-background">
        <Container className="flex items-center gap-3 py-2.5">
          <Link href="/dashboard" aria-label="SimpleDash dashboard" className="rounded-md">
            <LogoMark className="size-7 text-brand" />
          </Link>
          {nav}
        </Container>
      </header>
      <main id="main" className="py-8">
        <Container>{children}</Container>
      </main>
    </>
  );
}

/** Shown while the dashboard loads: the final layout, so nothing moves when numbers arrive. */
export function DashboardSkeleton({
  message,
  header = true,
}: {
  message?: string;
  /** The dashboard's top bar. Public pages have none. */
  header?: boolean;
}) {
  return (
    <>
      {header ? (
        <header className="border-b bg-background">
          <Container className="flex h-14 items-center gap-3">
            <Logo />
            <Skeleton className="ml-auto h-9 w-28" />
          </Container>
        </header>
      ) : null}
      <main id="main" className="pb-16" aria-busy="true">
        <Container className="flex flex-col gap-4 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-40 rounded-lg pointer-coarse:h-11" />
            <Skeleton className="h-9 w-36 rounded-lg pointer-coarse:h-11" />
            <p className="h-5 text-sm text-muted-foreground sm:ml-1" role="status">
              {message ?? ""}
            </p>
          </div>
          <Skeleton className="h-6 w-3/4 max-w-xl" />
          <div className="@container overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="grid grid-cols-2 @3xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-2.5 px-4 py-4 @2xl:px-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
            <div className="px-3 pt-1 pb-4 @2xl:px-5">
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-56 rounded-lg @2xl:h-64" />
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}

/** The sample site's chip, with a "Sample data" badge so nobody mistakes it for theirs. */
export function SampleSiteChip() {
  return (
    <SiteChip domain={null} label={SAMPLE_DOMAIN}>
      <Badge variant="secondary">Sample data</Badge>
    </SiteChip>
  );
}
