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
  "free",
  "pro",
  "pro-yearly",
  "cancelling",
  "past-due",
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
  const pro = (over: Partial<Extract<PlanState, { kind: "paid" }>> = {}): PlanState => ({
    kind: "paid",
    plan: "pro",
    interval: "month",
    renewsAt: new Date(now + 20 * day),
    cancelAtPeriodEnd: false,
    pastDue: false,
    ...over,
  });
  const free: PlanState = { kind: "free" };
  return {
    free,
    pro: pro(),
    "pro-yearly": pro({ interval: "year", renewsAt: new Date(now + 300 * day) }),
    cancelling: pro({ cancelAtPeriodEnd: true }),
    "past-due": pro({ renewsAt: new Date(now + 3 * day), pastDue: true }),
    errors: free,
    "public-on": free,
    downgraded: free,
    "search-off": pro(),
    "search-pick": pro({ interval: "year", renewsAt: new Date(now + 200 * day) }),
  } satisfies Record<(typeof STATES)[number], PlanState>;
}

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/settings">, "searchParams">) {
  await connection(); // "days left" depends on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "free";
  const plans: Record<(typeof STATES)[number], PlanState> = previewPlans();
  const several = state === "pro" || state === "downgraded";
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
          weeklyEmail
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
          siteLimit={plans[state].kind === "paid" ? 10 : 1}
          hasSignupEvent={state !== "free"}
          billingError={state === "errors"}
          deleteProblem={state === "errors" ? "error" : null}
          sitesNotice={state === "errors" ? "error" : null}
          siteSections={
            plans[state].kind === "paid" ? (
              <>
                <SettingsSection id="search" title="Google Search Console">
                  <SearchConsoleSettings
                    label="yoursite.com"
                    granted={state !== "search-off"}
                    property={state === "pro" ? PROPERTIES[0]! : null}
                    properties={state === "search-off" ? null : PROPERTIES}
                    brand={{
                      fromDomain: ["yoursite"],
                      extra: state === "pro" ? ["your site"] : [],
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
                      state === "pro"
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
                    saleEvent={state === "pro" ? "purchase" : null}
                    salePage={null}
                    keyEvents={["purchase", "sign_up", "trial_started"]}
                    result={null}
                    action={noop}
                  />
                </SettingsSection>
              </>
            ) : (
              <div id="search">
                <UpgradePanel feature="search" upgrade={noop} />
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
