import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { upgrade } from "@/app/actions/billing";
import { savePublicPageAction } from "@/app/actions/public-page";
import { removeStripeAction, saveSaleAction, saveStripeKeyAction } from "@/app/actions/revenue";
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
import { PublicPageSettings, RemoveSiteSettings } from "@/components/settings/settings-sections";
import {
  SettingsHeader,
  SettingsSection,
  SettingsSkeleton,
} from "@/components/settings/settings-shell";
import { Notice } from "@/components/shared/notice";
import { ScrollToHash } from "@/components/shared/scroll-to-hash";
import { SiteIcon } from "@/components/shared/site-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { defaultPublicCardIds } from "@/config/cards";
import { plans } from "@/config/plans";
import { getGoogleAccount } from "@/lib/auth/google";
import { hasSearchConsoleScope } from "@/lib/auth/scopes";
import { requireUser } from "@/lib/auth/session";
import type { Site } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { formatAgo, formatDate } from "@/lib/format";
import { listKeyEventNames } from "@/lib/ga4/properties";
import { getSitePublicPage } from "@/lib/public-page/public-page";
import { slugFromDomain } from "@/lib/public-page/slug";
import { getRevenueSource } from "@/lib/revenue/revenue";
import { brandTerms } from "@/lib/search-console/brand";
import { listProperties } from "@/lib/search-console/connect";
import { propertyLabel } from "@/lib/search-console/match";
import { settingsRoutes } from "@/lib/settings-routes";
import { readSiteId } from "@/lib/sites/access";
import { getSiteContext, type SiteContext } from "@/lib/sites/sites";

export const metadata: Metadata = { title: "Site" };

type Props = PageProps<"/settings/sites/[siteId]">;

/**
 * Settings → one site (docs/SPEC.md sections 5 and 28): its public page, Google Search
 * Console, revenue from Stripe and what counts as a sale, and removing it. Only the
 * user's own sites; anything else is a 404.
 */
export default function SiteSettingsPage(props: Props) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SiteSettings {...props} />
    </Suspense>
  );
}

const labelOf = (site: Site) => site.domain ?? site.displayName;

async function SiteSettings({ params, searchParams }: Props) {
  const user = await requireUser();
  const [{ siteId }, query] = await Promise.all([params, searchParams]);
  const id = readSiteId(siteId);
  if (!id) notFound();
  const ctx = await getSiteContext(user.id, id);
  const { site } = ctx;
  if (!site) notFound();
  const label = labelOf(site);
  // The last site in the list stays: removing it would leave the dashboard with nothing.
  const listed = ctx.sites.filter((s) => s.addedAt !== null);
  const canRemove = site.addedAt !== null && listed.length > 1;

  const header = (
    <SettingsHeader
      icon={<SiteIcon domain={site.domain} />}
      title={label}
      description={
        site.displayName !== label
          ? `${site.displayName} · these settings are for this site only.`
          : "These settings are for this site only."
      }
      action={
        <Button asChild variant="outline" className="h-9 pointer-coarse:h-11">
          <Link href={`/dashboard?site=${site.id}` as Route}>Open dashboard</Link>
        </Button>
      }
    />
  );
  const removedNotice =
    query.removed === "1" ? (
      <Notice title="The site was removed from your sites.">
        Its notes and settings are kept: open it again from the site menu to bring them back.
      </Notice>
    ) : query.removed === "error" ? (
      <Notice tone="danger" title="That site couldn't be removed.">
        Your last site can&apos;t be removed. Open another site from the site menu first.
      </Notice>
    ) : null;
  const remove = canRemove ? (
    <RemoveSiteSettings label={label} siteId={site.id} action={removeSiteAction} />
  ) : null;

  const page = await getSitePublicPage(site.id);
  return (
    <>
      {header}
      {removedNotice}
      <PublicPageSettings
        label={label}
        formKey={site.id}
        base={`${env.APP_URL}/p/`}
        values={
          page
            ? {
                slug: page.slug,
                enabled: page.enabled,
                indexable: page.indexable,
                cards: page.cards,
              }
            : {
                slug: slugFromDomain(label),
                enabled: false,
                indexable: true,
                cards: [...defaultPublicCardIds],
              }
        }
        hasSignupEvent={!!site.signupEvent}
        action={savePublicPageAction.bind(null, site.id)}
      />
      <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
        <SearchConsoleSection
          site={site}
          ctx={ctx}
          result={typeof query.search === "string" ? query.search : null}
        />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
        <RevenueSections
          site={site}
          ctx={ctx}
          saleResult={typeof query.sale === "string" ? query.sale : null}
          removed={query.revenue === "removed"}
        />
      </Suspense>
      {remove}
      <ScrollToHash />
    </>
  );
}

/** Google Search Console for one site (docs/SPEC.md section 28.2). */
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
        label={labelOf(site)}
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

/** Revenue from Stripe and "What counts as a sale?" for one site (docs/SPEC.md section 28.3). */
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
      <SettingsSection
        id="revenue"
        title="Revenue and sales"
        description={`Revenue from Stripe next to your visitors, and sales and signups by source, are part of ${plans.pro.name}, with Google search insights.`}
      >
        <Button asChild variant="outline" className="h-9 self-start pointer-coarse:h-11">
          <Link href={settingsRoutes.billing as Route}>See {plans.pro.name}</Link>
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
