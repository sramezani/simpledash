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
import type { Site } from "@/lib/db/schema";
import { canAddSite } from "@/lib/sites/access";
import { getSiteContext } from "@/lib/sites/sites";
import { siteWeek } from "@/lib/sites/summary";

export const metadata: Metadata = { title: "All sites", robots: { index: false, follow: false } };

/** All sites (docs/SPEC.md section 28.1): Pro's overview; Free sees the upgrade panel. */
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
  const { ent, sites, openable } = await getSiteContext(user.id);
  const multiple = ent.sites > 1;
  // Free sees its one site; Pro sees every site it can open.
  const shown = multiple ? openable : openable.slice(0, 1);
  return (
    <SitesView
      upgrade={multiple ? null : <UpgradePanel feature="sites" upgrade={upgrade} />}
      cards={shown.map((s) => (
        <Suspense key={s.id} fallback={<SiteCardSkeleton label={labelOf(s)} domain={s.domain} />}>
          <SiteCardLoader site={s} />
        </Suspense>
      ))}
      add={
        multiple && canAddSite(sites, ent) ? (
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

async function SiteCardLoader({ site }: { site: Site }) {
  const week = await siteWeek(site);
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
