import "server-only";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { CardId } from "@/config/cards";
import { getBilling } from "@/lib/billing/billing";
import { entitlements, planState, type Entitlements } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { publicPage, site, type PublicPage, type Site } from "@/lib/db/schema";
import { getReports } from "@/lib/ga4/cache";
import { cacheDeps } from "@/lib/ga4/data";
import { allowPublicCustomRange } from "@/lib/ga4/limiter";
import {
  comparisonGap,
  customDays,
  rangeForPlan,
  type RangeType,
  type RangeWindow,
} from "@/lib/ga4/ranges";
import { REPORTS, type Payloads, type ReportName } from "@/lib/ga4/reports";
import { reportError } from "@/lib/report-error";
import { getUserSites } from "@/lib/sites/sites";

/**
 * What a public page shows (docs/SPEC.md section 15), cached for about 10 minutes
 * and tagged `public:<slug>`, so saving settings shows at once. It holds no private
 * data: no email, name, notes, settings or property ID.
 */

export type PublicReports = { [R in ReportName]?: { data: Payloads[R] | null } };

export type PublicView =
  | { kind: "missing" }
  | { kind: "paused"; label: string }
  | {
      kind: "live";
      label: string;
      slug: string;
      cards: CardId[];
      indexable: boolean;
      range: RangeType;
      window: RangeWindow;
      reports: PublicReports;
      /** Only when Signups is one of the chosen cards. */
      signupEvent: string | null;
      /** Why the numbers can't be compared with the period before, or null when they can. */
      comparisonGap: string | null;
      /** Too many new custom ranges were asked for this hour: only cached numbers are shown. */
      customLimited: boolean;
      /** "Powered by SimpleDash" at the bottom (Free owners, and the demo). */
      poweredBy: boolean;
      /** Any range; false for Free owners, whose page stops at 30 days like their dashboard. */
      fullHistory: boolean;
    };

export const publicTag = (slug: string) => `public:${slug}`;

/**
 * The site a public page shows, the owner's plan, and whether the page is paused
 * (Google access ended). Null when the site is gone or left the owner's list.
 */
export async function publicSiteOf(
  page: Pick<PublicPage, "siteId" | "userId">,
): Promise<{ site: Site; paused: boolean; ent: Entitlements } | null> {
  const [billingRow, ownerSites] = await Promise.all([
    getBilling(page.userId),
    getUserSites(page.userId),
  ]);
  const owned = ownerSites.find((s) => s.id === page.siteId);
  if (!owned) return null;
  const ent = entitlements(planState(billingRow));
  return { site: owned, paused: owned.status !== "ok", ent };
}

/** Which reports a set of public cards needs. */
function reportsFor(cards: CardId[]): ReportName[] {
  const need = new Set<ReportName>(["totals"]);
  const map: Partial<Record<CardId, ReportName[]>> = {
    signups: ["actions"],
    chart: ["series"],
    sources: ["sources", "channels"],
    ai: ["ai_sources", "ai_pages"],
    pages: ["pages", "landing"],
    countries: ["countries", "cities"],
    devices: ["devices", "browsers", "systems"],
  };
  for (const c of cards) for (const r of map[c] ?? []) need.add(r);
  return REPORTS.filter((r) => need.has(r));
}

export async function getPublicView(
  slug: string,
  requested: RangeType,
  /** The landing page's demo (src/config/demo.ts): every range, and the link always. */
  demo = false,
): Promise<PublicView> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86_400 });
  cacheTag(publicTag(slug));

  const page = await db.query.publicPage.findFirst({ where: eq(publicPage.slug, slug) });
  if (!page || !page.enabled) return { kind: "missing" };
  const resolved = await publicSiteOf(page);
  if (!resolved) return { kind: "missing" };
  const { site: owned, paused, ent } = resolved;
  const label = owned.domain ?? owned.displayName;
  if (paused) return { kind: "paused", label };

  const cards = page.cards as CardId[];
  // A Free owner's page shows the last 30 days at most, like their dashboard.
  const fullHistory = ent.fullHistory || demo;
  const { range } = rangeForPlan(requested, fullHistory, owned.timeZone);
  // after() isn't available inside a cache scope: a stale report refreshes in the background here.
  const deps = {
    ...cacheDeps,
    schedule: (task: () => Promise<void>) => {
      void task().catch((error) => reportError("Public page refresh failed", error, { slug }));
    },
  };
  const customLimited =
    customDays(range) !== null && !allowPublicCustomRange(owned.propertyId, range);
  const result = await getReports(owned, range, reportsFor(cards), deps, {
    audience: "public",
    cacheOnly: customLimited,
  });
  return {
    kind: "live",
    label,
    slug,
    cards,
    indexable: page.indexable,
    range,
    window: result.window,
    reports: Object.fromEntries(
      Object.entries(result.reports).map(([r, v]) => [r, { data: v.data }]),
    ),
    signupEvent: cards.includes("signups") ? owned.signupEvent : null,
    comparisonGap: comparisonGap(result.window, owned.propertyCreatedAt),
    customLimited,
    poweredBy: ent.poweredBy || demo,
    fullHistory,
  };
}

/** Public pages for the sitemap: on, indexable, and their site in the owner's list and working. */
export async function listIndexablePublicPages() {
  return db
    .select({ slug: publicPage.slug, updatedAt: publicPage.updatedAt })
    .from(publicPage)
    .innerJoin(site, eq(site.id, publicPage.siteId))
    .where(
      and(
        eq(publicPage.enabled, true),
        eq(publicPage.indexable, true),
        eq(site.status, "ok"),
        or(isNotNull(site.addedAt), eq(site.isActive, true)),
      ),
    );
}
