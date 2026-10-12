import "server-only";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { CardId } from "@/config/cards";
import { getBilling } from "@/lib/billing/billing";
import { planState } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { billing, publicPage, site } from "@/lib/db/schema";
import { getReports } from "@/lib/ga4/cache";
import { cacheDeps } from "@/lib/ga4/data";
import { comparisonGap, type RangeType, type RangeWindow } from "@/lib/ga4/ranges";
import { REPORTS, type Payloads, type ReportName } from "@/lib/ga4/reports";
import { reportError } from "@/lib/report-error";

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
    };

export const publicTag = (slug: string) => `public:${slug}`;

/** Which reports a set of public cards needs. */
function reportsFor(cards: CardId[]): ReportName[] {
  const need = new Set<ReportName>(["totals"]);
  const map: Partial<Record<CardId, ReportName[]>> = {
    summary: ["totals", "sources", "actions"],
    signups: ["actions"],
    chart: ["series"],
    sources: ["sources", "channels"],
    ai: ["ai_sources", "ai_pages"],
    pages: ["pages", "landing"],
    countries: ["countries"],
    devices: ["devices"],
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
  const owned = await db.query.site.findFirst({
    where: and(eq(site.userId, page.userId), eq(site.isActive, true)),
  });
  if (!owned) return { kind: "missing" };
  const label = owned.domain ?? owned.displayName;
  const plan = planState(await getBilling(page.userId));
  if (plan.kind === "locked" || owned.status !== "ok") return { kind: "paused", label };

  const cards = page.cards as CardId[];
  // after() isn't available inside a cache scope: a stale report refreshes in the background here.
  const deps = {
    ...cacheDeps,
    schedule: (task: () => Promise<void>) => {
      void task().catch((error) => reportError("Public page refresh failed", error, { slug }));
    },
  };
  const result = await getReports(owned, range, reportsFor(cards), deps, { audience: "public" });
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
  };
}

/** Public pages for the sitemap: on, indexable and not paused. One query. */
export async function listIndexablePublicPages(now: Date = new Date()) {
  const rows = await db
    .select({
      slug: publicPage.slug,
      updatedAt: publicPage.updatedAt,
      billing: {
        trialEndsAt: billing.trialEndsAt,
        status: billing.status,
        planInterval: billing.planInterval,
        currentPeriodEnd: billing.currentPeriodEnd,
        cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
      },
    })
    .from(publicPage)
    .innerJoin(site, and(eq(site.userId, publicPage.userId), eq(site.isActive, true)))
    .innerJoin(billing, eq(billing.userId, publicPage.userId))
    .where(
      and(eq(publicPage.enabled, true), eq(publicPage.indexable, true), eq(site.status, "ok")),
    );
  return rows
    .filter((r) => planState(r.billing, now).kind !== "locked")
    .map((r) => ({ slug: r.slug, updatedAt: r.updatedAt }));
}
