import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { UpgradePanel } from "@/components/dashboard/upgrade-panel";
import { RevenueSettings } from "@/components/settings/revenue-settings";
import { SaleSettings } from "@/components/settings/sale-settings";
import { SearchConsoleSettings } from "@/components/settings/search-console-settings";
import { SettingsNav } from "@/components/settings/settings-nav";
import {
  BillingSettings,
  DeleteAccountSettings,
  EmailSettings,
  GoogleSettings,
  ProfileSettings,
  PublicPageSettings,
  RemoveSiteSettings,
} from "@/components/settings/settings-sections";
import {
  SettingsHeader,
  SettingsSection,
  SettingsShell,
  SettingsSkeleton,
} from "@/components/settings/settings-shell";
import { SiteIcon } from "@/components/shared/site-icon";
import { defaultPublicCardIds } from "@/config/cards";
import type { PlanState } from "@/lib/billing/plan";
import { uiKitEnabled } from "@/lib/env";
import { settingsNavGroups } from "@/lib/settings-nav";

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
  "free-sites",
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

/** Dev only: every settings page in each state, without signing in. */
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
    "free-sites": free,
    "search-off": pro(),
    "search-pick": pro({ interval: "year", renewsAt: new Date(now + 200 * day) }),
  } satisfies Record<(typeof STATES)[number], PlanState>;
}

const PAGES = ["account", "billing", "email", "site"] as const;
type PreviewPage = (typeof PAGES)[number];

const PREVIEW_SITES = [
  { id: "00000000-0000-4000-8000-000000000001", label: "yoursite.com", domain: null },
  { id: "00000000-0000-4000-8000-000000000002", label: "blog.yoursite.com", domain: null },
  { id: "00000000-0000-4000-8000-000000000003", label: "docs.yoursite.com", domain: null },
];

async function Preview({ searchParams }: Pick<PageProps<"/ui-kit/settings">, "searchParams">) {
  await connection(); // renewal dates depend on the current time
  const params = await searchParams;
  const state = STATES.find((s) => s === params.state) ?? "free";
  // A site ID (the site menu's gear) opens that site's page.
  const siteParam = typeof params.site === "string" ? params.site : null;
  const page: PreviewPage = siteParam
    ? "site"
    : (PAGES.find((p) => p === params.page) ?? "account");
  const plan = previewPlans()[state];
  const paid = plan.kind === "paid";
  // Sites have no limit on any plan: "free-sites" is Free with three of them.
  const several = state === "pro" || state === "free-sites";
  const sites = PREVIEW_SITES.slice(0, several ? 3 : 1);
  const site = sites.find((s) => s.id === siteParam) ?? sites[0]!;

  const href = (to: PreviewPage, siteId?: string) => {
    const query = new URLSearchParams({ state });
    if (to !== "account") query.set("page", to);
    if (siteId) query.set("site", siteId);
    return `/ui-kit/settings?${query}`;
  };
  const groups = settingsNavGroups(sites, {
    account: href("account"),
    billing: href("billing"),
    email: href("email"),
    site: (id) => href("site", id),
  });
  const activeHref = page === "site" ? href("site", site.id) : href(page);

  return (
    <>
      <nav
        aria-label="Preview states"
        className="flex flex-wrap gap-1 border-b bg-muted px-4 py-2 text-xs"
      >
        {STATES.map((s) => (
          <Link
            key={s}
            href={{ pathname: "/ui-kit/settings", query: { state: s, page } }}
            aria-current={s === state ? "page" : undefined}
            className="rounded-md px-2 py-1 aria-[current=page]:bg-card aria-[current=page]:font-medium"
          >
            {s}
          </Link>
        ))}
      </nav>
      <SettingsShell
        dashboardHref="/ui-kit/dashboard"
        nav={<SettingsNav groups={groups} activeHref={activeHref} />}
      >
        {page === "account" ? (
          <>
            <SettingsHeader
              title="Profile"
              description="Your account, and SimpleDash's access to Google."
            />
            <ProfileSettings
              user={{ name: "Alex Example", email: "alex@yoursite.com" }}
              signOut={noop}
            />
            <GoogleSettings siteCount={sites.length} disconnect={noop} />
            <DeleteAccountSettings problem={state === "errors" ? "error" : null} action={noop} />
          </>
        ) : page === "billing" ? (
          <>
            <SettingsHeader title="Plan & billing" description="Your plan, and Stripe." />
            <BillingSettings
              plan={plan}
              error={state === "errors"}
              upgrade={noop}
              manageBilling={noop}
            />
          </>
        ) : page === "email" ? (
          <>
            <SettingsHeader
              title="Monday email"
              description="Last week's numbers in your inbox, every Monday afternoon in your site's time zone."
            />
            <EmailSettings
              plan={plan}
              on
              email="alex@yoursite.com"
              siteCount={sites.length}
              action={noop}
              billingHref={href("billing")}
            />
          </>
        ) : (
          <>
            <SettingsHeader
              icon={<SiteIcon domain={site.domain} />}
              title={site.label}
              description="These settings are for this site only."
            />
            <PublicPageSettings
              label={site.label}
              formKey={site.id}
              base="http://localhost:3000/p/"
              values={{
                slug: "yoursite-com",
                enabled: state === "public-on",
                indexable: true,
                cards: [...defaultPublicCardIds],
              }}
              hasSignupEvent={state !== "free"}
              action={noopSave}
            />
            {paid ? (
              <>
                <SettingsSection id="search" title="Google Search Console">
                  <SearchConsoleSettings
                    label={site.label}
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
              <div id="search" className="scroll-mt-20">
                <UpgradePanel feature="search" upgrade={noop} />
              </div>
            )}
            {sites.length > 1 ? (
              <RemoveSiteSettings label={site.label} siteId={site.id} action={noop} />
            ) : null}
          </>
        )}
      </SettingsShell>
    </>
  );
}
