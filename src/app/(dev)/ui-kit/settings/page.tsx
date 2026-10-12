import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SettingsFrame, SettingsSkeleton, SettingsView } from "@/components/settings/settings-view";
import { defaultPublicCardIds } from "@/config/cards";
import type { PlanState } from "@/lib/billing/plan";
import { uiKitEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings preview",
  robots: { index: false, follow: false },
};

const STATES = ["trial", "paid", "past-due", "locked", "errors", "public-on"] as const;

/** The preview's buttons do nothing. */
async function noop() {
  "use server";
}

async function noopSave() {
  "use server";
  return { saved: true };
}

/** Dev only: the settings page in each state, without signing in. */
export default function SettingsPreviewPage({ searchParams }: PageProps<"/ui-kit/settings">) {
  if (!uiKitEnabled) notFound();
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

/** A plan for each preview state, relative to now. */
function previewPlans() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    trial: { kind: "trial", endsAt: new Date(now + 9 * day), daysLeft: 9 },
    paid: {
      kind: "paid",
      interval: "year",
      renewsAt: new Date(now + 300 * day),
      cancelAtPeriodEnd: false,
      pastDue: false,
    },
    "past-due": {
      kind: "paid",
      interval: "month",
      renewsAt: new Date(now + 3 * day),
      cancelAtPeriodEnd: false,
      pastDue: true,
    },
    locked: { kind: "locked", trialEndedAt: new Date(now - 2 * day) },
    errors: { kind: "trial", endsAt: new Date(now + day / 2), daysLeft: 1 },
    "public-on": { kind: "trial", endsAt: new Date(now + 13 * day), daysLeft: 13 },
  } satisfies Record<(typeof STATES)[number], PlanState>;
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/settings">, "searchParams">) {
  await connection(); // "days left" depends on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "trial";
  const plans: Record<(typeof STATES)[number], PlanState> = previewPlans();
  return (
    <>
      <nav
        aria-label="Preview states"
        className="flex flex-wrap gap-1 border-b bg-muted px-4 py-2 text-xs"
      >
        {STATES.map((s) => (
          <Link
            key={s}
            href={{ pathname: "/ui-kit/settings", query: { state: s } }}
            aria-current={s === state ? "page" : undefined}
            className="rounded-md px-2 py-1 aria-[current=page]:bg-card aria-[current=page]:font-medium"
          >
            {s}
          </Link>
        ))}
      </nav>
      <SettingsFrame>
        <SettingsView
          user={{ name: "Alex Example", email: "alex@yoursite.com" }}
          weeklyEmail={state !== "locked"}
          plan={plans[state]}
          publicPage={{
            slug: "yoursite-com",
            enabled: state === "public-on",
            indexable: true,
            cards: [...defaultPublicCardIds],
          }}
          publicBase="http://localhost:3000/p/"
          label="yoursite.com"
          hasSignupEvent={state !== "trial"}
          billingError={state === "errors"}
          deleteProblem={state === "errors" ? "error" : null}
          actions={{
            signOut: noop,
            setWeeklyEmail: noop,
            savePublicPage: noopSave,
            upgrade: noop,
            manageBilling: noop,
            disconnectGoogle: noop,
            deleteAccount: noop,
          }}
        />
      </SettingsFrame>
    </>
  );
}
