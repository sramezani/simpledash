import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { UpgradePanel } from "@/components/dashboard/upgrade-panel";
import { RevenueSettings } from "@/components/settings/revenue-settings";
import { SaleSettings } from "@/components/settings/sale-settings";
import { SearchConsoleSettings } from "@/components/settings/search-console-settings";
import {
  SettingsFrame,
  SettingsSection,
  SettingsSkeleton,
  SettingsView,
} from "@/components/settings/settings-view";
import { defaultPublicCardIds } from "@/config/cards";
import type { PlanState } from "@/lib/billing/plan";
import { uiKitEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings preview",
  robots: { index: false, follow: false },
};

const STATES = [
  "trial",
  "paid",
  "growth",
  "past-due",
  "locked",
  "errors",
  "public-on",
  "downgraded",
  "search-off",
  "search-pick",
] as const;

/** The preview's buttons do nothing. */
async function noop() {
  "use server";
}

async function noopSave() {
  "use server";
  return { saved: true };
}

async function noopKey() {
  "use server";
  return { error: "This is a preview: no key was checked." };
}

async function noopBrand() {
  "use server";
  return { saved: true };
}

const PROPERTIES = [
  { siteUrl: "sc-domain:yoursite.com", label: "Domain yoursite.com" },
  { siteUrl: "https://blog.yoursite.com/", label: "https://blog.yoursite.com/" },
];

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
      plan: "starter",
      interval: "year",
      renewsAt: new Date(now + 300 * day),
      cancelAtPeriodEnd: false,
      pastDue: false,
    },
    growth: {
      kind: "paid",
      plan: "growth",
      interval: "month",
      renewsAt: new Date(now + 20 * day),
      cancelAtPeriodEnd: false,
      pastDue: false,
    },
    downgraded: {
      kind: "paid",
      plan: "starter",
      interval: "month",
      renewsAt: new Date(now + 20 * day),
      cancelAtPeriodEnd: false,
      pastDue: false,
    },
    "past-due": {
      kind: "paid",
      plan: "starter",
      interval: "month",
      renewsAt: new Date(now + 3 * day),
      cancelAtPeriodEnd: false,
      pastDue: true,
    },
    locked: { kind: "locked", trialEndedAt: new Date(now - 2 * day) },
    errors: { kind: "trial", endsAt: new Date(now + day / 2), daysLeft: 1 },
    "public-on": { kind: "trial", endsAt: new Date(now + 13 * day), daysLeft: 13 },
    "search-off": {
      kind: "paid",
      plan: "growth",
      interval: "month",
      renewsAt: new Date(now + 20 * day),
      cancelAtPeriodEnd: false,
      pastDue: false,
    },
    "search-pick": {
      kind: "paid",
      plan: "growth",
      interval: "year",
      renewsAt: new Date(now + 200 * day),
      cancelAtPeriodEnd: false,
      pastDue: false,
    },
  } satisfies Record<(typeof STATES)[number], PlanState>;
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/settings">, "searchParams">) {
  await connection(); // "days left" depends on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "trial";
  const plans: Record<(typeof STATES)[number], PlanState> = previewPlans();
  const several = state === "growth" || state === "downgraded";
  const sites = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      label: "yoursite.com",
      domain: null,
      paused: false,
    },
    ...(several
      ? [
          { id: "00000000-0000-4000-8000-000000000002", label: "blog.yoursite.com", domain: null },
          { id: "00000000-0000-4000-8000-000000000003", label: "docs.yoursite.com", domain: null },
        ].map((s) => ({ ...s, paused: state === "downgraded" }))
      : []),
  ];
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
          sites={sites}
          site={sites[0]!}
          siteLimit={state === "growth" ? 10 : 1}
          hasSignupEvent={state !== "trial"}
          billingError={state === "errors"}
          deleteProblem={state === "errors" ? "error" : null}
          sitesNotice={state === "errors" ? "error" : null}
          siteSections={
            plans[state].kind === "paid" &&
            (plans[state] as { plan?: string }).plan === "growth" ? (
              <>
                <SettingsSection id="search" title="Google Search Console">
                  <SearchConsoleSettings
                    label="yoursite.com"
                    granted={state !== "search-off"}
                    property={state === "growth" ? PROPERTIES[0]! : null}
                    properties={state === "search-off" ? null : PROPERTIES}
                    brand={{
                      fromDomain: ["yoursite"],
                      extra: state === "growth" ? ["your site"] : [],
                    }}
                    result={state === "search-pick" ? "no_match" : null}
                    actions={{
                      connect: noop,
                      choose: noop,
                      disconnect: noop,
                      saveBrand: noopBrand,
                    }}
                  />
                </SettingsSection>
                <SettingsSection id="revenue" title="Revenue from Stripe">
                  <RevenueSettings
                    connection={
                      state === "growth"
                        ? {
                            keyHint: "x9Qa",
                            livemode: true,
                            status: "ok",
                            synced: "Synced 12 minutes ago",
                            coversFrom: "1 Sep 2024",
                          }
                        : null
                    }
                    save={noopKey}
                    remove={noop}
                  />
                </SettingsSection>
                <SettingsSection id="sales" title="What counts as a sale?">
                  <SaleSettings
                    saleEvent={state === "growth" ? "purchase" : null}
                    salePage={null}
                    keyEvents={["purchase", "sign_up", "trial_started"]}
                    result={null}
                    action={noop}
                  />
                </SettingsSection>
              </>
            ) : (
              <div id="search">
                <UpgradePanel feature="search" plan={plans[state]} upgrade={noop} />
              </div>
            )
          }
          actions={{
            signOut: noop,
            setWeeklyEmail: noop,
            savePublicPage: noopSave,
            upgrade: noop,
            manageBilling: noop,
            disconnectGoogle: noop,
            deleteAccount: noop,
            removeSite: noop,
          }}
        />
      </SettingsFrame>
    </>
  );
}
