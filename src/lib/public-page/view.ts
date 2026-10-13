import "server-only";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { CardId } from "@/config/cards";
import { getBilling } from "@/lib/billing/billing";
import { entitlements, planState } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { billing, publicPage, site, type PublicPage, type Site } from "@/lib/db/schema";
import { getReports } from "@/lib/ga4/cache";
import { cacheDeps } from "@/lib/ga4/data";
import { allowPublicCustomRange } from "@/lib/ga4/limiter";
import { comparisonGap, customDays, type RangeType, type RangeWindow } from "@/lib/ga4/ranges";
import { REPORTS, type Payloads, type ReportName } from "@/lib/ga4/reports";
import { reportError } from "@/lib/report-error";
import { openableSites } from "@/lib/sites/access";
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
    };

export const publicTag = (slug: string) => `public:${slug}`;

/**
 * The site a public page shows, and whether the page is paused: the trial ended
 * unpaid, Google access ended, or the site was removed or isn't open on the owner's
 * plan any more (back on Starter with several sites). Null when the site is gone.
 */
export async function publicSiteOf(
  page: Pick<PublicPage, "siteId" | "userId">,
): Promise<{ site: Site; paused: boolean } | null> {
  const [billingRow, ownerSites] = await Promise.all([
    getBilling(page.userId),
    getUserSites(page.userId),
  ]);
  const owned = ownerSites.find((s) => s.id === page.siteId);
  if (!owned) return null;
  const plan = planState(billingRow);
  const open = openableSites(ownerSites, entitlements(plan)).some((s) => s.id === owned.id);
  return { site: owned, paused: plan.kind === "locked" || owned.status !== "ok" || !open };
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

export async function getPublicView(slug: string, range: RangeType): Promise<PublicView> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86_400 });
  cacheTag(publicTag(slug));

  const page = await db.query.publicPage.findFirst({ where: eq(publicPage.slug, slug) });
  if (!page || !page.enabled) return { kind: "missing" };
  const resolved = await publicSiteOf(page);
  if (!resolved) return { kind: "missing" };
  const { site: owned, paused } = resolved;
  const label = owned.domain ?? owned.displayName;
  if (paused) return { kind: "paused", label };

  const cards = page.cards as CardId[];
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
  };
}

/** Public pages for the sitemap: on, indexable and not paused. Two queries. */
export async function listIndexablePublicPages(now: Date = new Date()) {
  const rows = await db
    .select({
      slug: publicPage.slug,
      siteId: publicPage.siteId,
      userId: publicPage.userId,
      updatedAt: publicPage.updatedAt,
      billing: {
        trialEndsAt: billing.trialEndsAt,
        status: billing.status,
        plan: billing.plan,
        planInterval: billing.planInterval,
        currentPeriodEnd: billing.currentPeriodEnd,
        cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
      },
    })
    .from(publicPage)
    .innerJoin(site, eq(site.id, publicPage.siteId))
    .innerJoin(billing, eq(billing.userId, publicPage.userId))
    .where(
      and(eq(publicPage.enabled, true), eq(publicPage.indexable, true), eq(site.status, "ok")),
    );
  const live = rows.filter((r) => planState(r.billing, now).kind !== "locked");
  if (live.length === 0) return [];
  const owners = [...new Set(live.map((r) => r.userId))];
  const ownerSites = await db
    .select({ id: site.id, userId: site.userId, isActive: site.isActive, addedAt: site.addedAt })
    .from(site)
    .where(and(inArray(site.userId, owners), or(isNotNull(site.addedAt), eq(site.isActive, true))));
  return live
    .filter((r) => {
      const mine = ownerSites.filter((s) => s.userId === r.userId);
      const ent = entitlements(planState(r.billing, now));
      return openableSites(mine, ent).some((s) => s.id === r.siteId);
    })
    .map((r) => ({ slug: r.slug, updatedAt: r.updatedAt }));
}
