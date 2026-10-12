import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardFrame } from "@/components/dashboard/states";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsage } from "@/lib/admin/usage";
import { getSession, requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { formatNumber, formatPercent } from "@/lib/format";

async function isAdmin() {
  const session = await getSession();
  return !!session && env.ADMIN_EMAILS.includes(session.user.email.toLowerCase());
}

/** Nothing on the page names it until the visitor is known to be an admin. */
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
    title: (await isAdmin()) ? "Usage" : "Page not found",
    robots: { index: false, follow: false },
  };
}

/** Usage counts, only for ADMIN_EMAILS (docs/SPEC.md section 20). Everyone else gets "Page not found". */
export default function AdminPage() {
  return (
    <DashboardFrame>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
          <Counts />
        </Suspense>
      </div>
    </DashboardFrame>
  );
}

async function Counts() {
  await connection();
  await requireUser();
  if (!(await isAdmin())) notFound();
  const u = await getUsage();
  const groups: { title: string; rows: [string, string][] }[] = [
    {
      title: "Signups",
      rows: [
        ["Total", formatNumber(u.signups.total)],
        ["Last 7 days", formatNumber(u.signups.last7)],
        ["Last 30 days", formatNumber(u.signups.last30)],
      ],
    },
    {
      title: "Sites",
      rows: [
        ["Connected", formatNumber(u.sites.connected)],
        ["Waiting for a reconnect", formatNumber(u.sites.needsReconnect)],
      ],
    },
    {
      title: "Plans",
      rows: [
        ["On trial", formatNumber(u.plans.trial)],
        ["Paying monthly", formatNumber(u.plans.monthly)],
        ["Paying yearly", formatNumber(u.plans.yearly)],
        ...(u.plans.otherPaid > 0
          ? [["Paying, another price", formatNumber(u.plans.otherPaid)] as [string, string]]
          : []),
        ["Locked", formatNumber(u.plans.locked)],
        ["Trial to paid", u.trialToPaid === null ? "Not yet" : formatPercent(u.trialToPaid * 100)],
      ],
    },
    {
      title: "Features",
      rows: [
        ["Public pages on", formatNumber(u.publicPages)],
        ["Weekly email on", formatNumber(u.weeklyEmail)],
      ],
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:col-span-2">Usage</h1>
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">{g.title}</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
            {g.rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Weekly email opens are in Resend&apos;s dashboard.
      </p>
    </div>
  );
}
