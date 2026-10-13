import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { signInWithGoogle } from "@/app/actions/auth";
import { upgrade } from "@/app/actions/billing";
import { addSite, listMyProperties } from "@/app/actions/site";
import { AddSiteCard } from "@/components/dashboard/add-site-card";
import { SiteCard, SiteCardSkeleton } from "@/components/dashboard/site-card";
import { SitesView } from "@/components/dashboard/sites-view";
import { DashboardSkeleton } from "@/components/dashboard/states";
import { UpgradePanel } from "@/components/dashboard/upgrade-panel";
import { requireUser } from "@/lib/auth/session";
import { isLocked } from "@/lib/billing/plan";
import type { Site } from "@/lib/db/schema";
import { canAddSite } from "@/lib/sites/access";
import { getSiteContext } from "@/lib/sites/sites";
import { siteWeek } from "@/lib/sites/summary";

export const metadata: Metadata = { title: "All sites", robots: { index: false, follow: false } };

/** All sites (docs/SPEC.md section 28.1): Growth's overview; Starter sees the upgrade panel. */
export default function SitesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Sites />
    </Suspense>
  );
}

async function Sites() {
  await connection(); // the 7 days depend on the current time
  const user = await requireUser();
  const { plan, ent, sites, openable } = await getSiteContext(user.id);
  const growth = ent.sites > 1;
  const locked = isLocked(plan);
  // Starter sees its one site; Growth sees every site it can open.
  const shown = growth ? openable : openable.slice(0, 1);
  return (
    <SitesView
      upgrade={growth ? null : <UpgradePanel feature="sites" plan={plan} upgrade={upgrade} />}
      cards={shown.map((s) => (
        <Suspense key={s.id} fallback={<SiteCardSkeleton label={labelOf(s)} domain={s.domain} />}>
          <SiteCardLoader site={s} cacheOnly={locked} />
        </Suspense>
      ))}
      add={
        growth && canAddSite(sites, ent) && !locked ? (
          <AddSiteCard
            listAction={listMyProperties}
            addAction={addSite}
            listedProperties={sites.filter((s) => s.addedAt).map((s) => s.propertyId)}
            used={sites.filter((s) => s.addedAt).length}
            limit={ent.sites}
            reconnect={signInWithGoogle}
          />
        ) : null
      }
    />
  );
}

const labelOf = (s: Site) => s.domain ?? s.displayName;

async function SiteCardLoader({ site, cacheOnly }: { site: Site; cacheOnly: boolean }) {
  const week = await siteWeek(site, { cacheOnly });
  return (
    <SiteCard
      site={{
        id: site.id,
        label: labelOf(site),
        domain: site.domain,
        current: site.isActive,
        ...week,
      }}
    />
  );
}
