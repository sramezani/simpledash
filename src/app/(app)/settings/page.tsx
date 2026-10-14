import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteAccountAction, disconnectGoogleAction } from "@/app/actions/account";
import { signOut } from "@/app/actions/auth";
import { manageBilling, upgrade } from "@/app/actions/billing";
import { setWeeklyEmailAction } from "@/app/actions/email";
import { savePublicPageAction } from "@/app/actions/public-page";
import {
  chooseSearchPropertyAction,
  connectSearchConsoleAction,
  disconnectSearchConsoleAction,
  saveBrandTermsAction,
} from "@/app/actions/search-console";
import { removeSiteAction } from "@/app/actions/site";
import { UpgradePanel } from "@/components/dashboard/upgrade-panel";
import { RevenueSettings } from "@/components/settings/revenue-settings";
import { SaleSettings } from "@/components/settings/sale-settings";
import { SearchConsoleSettings } from "@/components/settings/search-console-settings";
import { removeStripeAction, saveSaleAction, saveStripeKeyAction } from "@/app/actions/revenue";
import { Notice } from "@/components/shared/notice";
import { Button } from "@/components/ui/button";
import { formatAgo, formatDate } from "@/lib/format";
import { listKeyEventNames } from "@/lib/ga4/properties";
import { getRevenueSource } from "@/lib/revenue/revenue";
import {
  SettingsFrame,
  SettingsSection,
  SettingsSkeleton,
  SettingsView,
  type SettingsSite,
} from "@/components/settings/settings-view";
import { Skeleton } from "@/components/ui/skeleton";
import { defaultPublicCardIds } from "@/config/cards";
import { getGoogleAccount } from "@/lib/auth/google";
import { hasSearchConsoleScope } from "@/lib/auth/scopes";
import { requireUser } from "@/lib/auth/session";
import type { SiteContext } from "@/lib/sites/sites";
import { brandTerms } from "@/lib/search-console/brand";
import { listProperties } from "@/lib/search-console/connect";
import { propertyLabel } from "@/lib/search-console/match";
import type { Site } from "@/lib/db/schema";
import { getSettings } from "@/lib/email/settings";
import { env } from "@/lib/env";
import { getSitePublicPage } from "@/lib/public-page/public-page";
import { slugFromDomain } from "@/lib/public-page/slug";
import { readSiteId } from "@/lib/sites/access";
import { getSiteContext } from "@/lib/sites/sites";
import { plans } from "@/config/plans";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

/**
 * Settings (docs/SPEC.md sections 5 and 28.1): account, weekly email, billing and
 * sites for the account; the public page (and later Search Console and revenue) for
 * one site at a time, `?site=<id>`.
 */
export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <SettingsFrame>
      <Suspense fallback={<SettingsSkeleton />}>
        <Sections searchParams={searchParams} />
      </Suspense>
    </SettingsFrame>
  );
}

async function Sections({ searchParams }: Pick<PageProps<"/settings">, "searchParams">) {
  const user = await requireUser();
  const params = await searchParams;
  const ctx = await getSiteContext(user.id, readSiteId(params.site));
  // The site settings are for an open site: the one asked for, or the active one.
  const fallback = ctx.openable.find((s) => s.isActive) ?? ctx.openable[0] ?? null;
  const site = ctx.choice.kind === "open" ? ctx.choice.site : fallback;
  const [settings, page] = await Promise.all([
    getSettings(user.id),
    site ? getSitePublicPage(site.id) : undefined,
  ]);
  const openable = new Set(ctx.openable.map((s) => s.id));
  const toSettingsSite = (s: Site): SettingsSite => ({
    id: s.id,
    label: s.domain ?? s.displayName,
    domain: s.domain,
    paused: !openable.has(s.id),
  });
  return (
    <SettingsView
      user={user}
      weeklyEmail={settings.weeklyEmail}
      plan={ctx.plan}
      sites={ctx.sites.map(toSettingsSite)}
      site={site ? toSettingsSite(site) : null}
      siteLimit={ctx.ent.sites}
      publicPage={
        page
          ? { slug: page.slug, enabled: page.enabled, indexable: page.indexable, cards: page.cards }
          : {
              slug: slugFromDomain(site ? (site.domain ?? site.displayName) : "my-site"),
              enabled: false,
              indexable: true,
              cards: [...defaultPublicCardIds],
            }
      }
      publicBase={`${env.APP_URL}/p/`}
      hasSignupEvent={!!site?.signupEvent}
      billingError={params.billing === "error"}
      deleteProblem={
        params.delete === "confirm" ? "confirm" : params.delete === "error" ? "error" : null
      }
      sitesNotice={
        params.sites === "removed" ? "removed" : params.sites === "error" ? "error" : null
      }
      siteSections={
        site ? (
          <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
            <SearchConsoleSection
              site={site}
              ctx={ctx}
              result={typeof params.search === "string" ? params.search : null}
            />
            <RevenueSections
              site={site}
              ctx={ctx}
              saleResult={typeof params.sale === "string" ? params.sale : null}
              removed={params.revenue === "removed"}
            />
          </Suspense>
        ) : null
      }
      actions={{
        signOut,
        setWeeklyEmail: setWeeklyEmailAction,
        savePublicPage: site
          ? savePublicPageAction.bind(null, site.id)
          : async () => ({ error: "Connect a Google Analytics site first." }),
        upgrade,
        manageBilling,
        disconnectGoogle: disconnectGoogleAction,
        deleteAccount: deleteAccountAction,
        removeSite: removeSiteAction,
      }}
    />
  );
}

/** Settings → Google Search Console for one site (docs/SPEC.md section 28.2). */
async function SearchConsoleSection({
  site,
  ctx,
  result,
}: {
  site: Site;
  ctx: SiteContext;
  result: string | null;
}) {
  if (!ctx.ent.searchConsole) {
    return (
      <div id="search" className="scroll-mt-20">
        <UpgradePanel feature="search" upgrade={upgrade} />
      </div>
    );
  }
  const label = site.domain ?? site.displayName;
  const account = await getGoogleAccount(site.userId);
  const granted = hasSearchConsoleScope(account?.scope);
  const listed = granted ? await listProperties(site.userId) : null;
  const properties =
    listed === null
      ? null
      : listed.kind === "ok"
        ? listed.properties.map((p) => ({ siteUrl: p.siteUrl, label: propertyLabel(p.siteUrl) }))
        : {
            problem:
              listed.problem === "scope"
                ? "SimpleDash can't read Search Console any more: connect it again."
                : "Couldn't load your Search Console properties from Google right now.",
          };
  return (
    <SettingsSection id="search" title="Google Search Console">
      <SearchConsoleSettings
        label={label}
        granted={granted && !(listed?.kind === "problem" && listed.problem === "scope")}
        property={
          site.searchConsoleUrl
            ? { siteUrl: site.searchConsoleUrl, label: propertyLabel(site.searchConsoleUrl) }
            : null
        }
        properties={properties}
        brand={{ fromDomain: brandTerms(site.domain), extra: site.brandTerms }}
        result={result}
        actions={{
          connect: connectSearchConsoleAction.bind(null, site.id, "settings"),
          choose: chooseSearchPropertyAction.bind(null, site.id),
          disconnect: disconnectSearchConsoleAction.bind(null, site.id),
          saveBrand: saveBrandTermsAction.bind(null, site.id),
        }}
      />
    </SettingsSection>
  );
}

/** Settings → Revenue from Stripe and "What counts as a sale?" (docs/SPEC.md section 28.3). */
async function RevenueSections({
  site,
  ctx,
  saleResult,
  removed,
}: {
  site: Site;
  ctx: SiteContext;
  saleResult: string | null;
  removed: boolean;
}) {
  if (!ctx.ent.revenue) {
    return (
      <SettingsSection id="revenue" title="Revenue and sales">
        <p className="text-sm text-pretty text-muted-foreground">
          Revenue from Stripe next to your visitors, and sales and signups by source, are part of{" "}
          {plans.pro.name}, with Google search insights.
        </p>
        <Button asChild variant="outline" className="h-9 self-start pointer-coarse:h-11">
          <a href="#billing">See {plans.pro.name}</a>
        </Button>
      </SettingsSection>
    );
  }
  const [source, keyEvents] = await Promise.all([
    getRevenueSource(site.id),
    site.status === "ok"
      ? listKeyEventNames(site.userId, site.propertyId).catch(() => null)
      : Promise.resolve(null),
  ]);
  return (
    <>
      <SettingsSection id="revenue" title="Revenue from Stripe">
        {removed ? (
          <Notice title="Stripe was removed, with every stored total for this site." />
        ) : null}
        <RevenueSettings
          connection={
            source
              ? {
                  keyHint: source.keyHint,
                  livemode: source.livemode,
                  status: source.status,
                  synced: source.lastSyncAt ? `Synced ${formatAgo(source.lastSyncAt)}` : null,
                  coversFrom: source.coversFrom
                    ? formatDate(new Date(`${source.coversFrom}T12:00:00Z`))
                    : null,
                }
              : null
          }
          save={saveStripeKeyAction.bind(null, site.id)}
          remove={removeStripeAction.bind(null, site.id)}
        />
      </SettingsSection>
      <SettingsSection id="sales" title="What counts as a sale?">
        <SaleSettings
          saleEvent={site.saleEvent}
          salePage={site.salePage}
          keyEvents={keyEvents}
          result={saleResult}
          action={saveSaleAction.bind(null, site.id)}
        />
      </SettingsSection>
    </>
  );
}
