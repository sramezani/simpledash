import "server-only";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { footer } from "@/config/footer";
import { db } from "@/lib/db/client";
import { publicPage } from "@/lib/db/schema";
import { getReports } from "@/lib/ga4/cache";
import { cacheDeps } from "@/lib/ga4/data";
import { todayIn } from "@/lib/ga4/ranges";
import { getLive } from "@/lib/ga4/realtime";
import { reportError } from "@/lib/report-error";
import { lastDays, tickerItems, type FooterStats } from "./footer-data";
import { publicSiteOf, publicTag } from "./view";

/**
 * What the footer's word and live band show (docs/SPEC.md section 17): SimpleDash's own
 * public page (src/config/footer.ts), and only what that page shows. Cached for about
 * 10 minutes and tagged like the page, so turning a card off shows at once.
 *
 * Null when there is nothing honest to draw (the page is missing, off or paused, or has
 * no chart): the footer then shows the plain word. Errors are thrown, so they aren't kept.
 */
export async function getFooterStats(): Promise<FooterStats | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86_400 });
  cacheTag(publicTag(footer.slug));

  const page = await db.query.publicPage.findFirst({ where: eq(publicPage.slug, footer.slug) });
  if (!page?.enabled || !page.cards.includes("chart")) return null;
  const resolved = await publicSiteOf(page);
  if (!resolved || resolved.paused) return null;
  const { site } = resolved;

  // after() isn't available inside a cache scope: a stale report refreshes in the background here.
  const deps = {
    ...cacheDeps,
    schedule: (task: () => Promise<void>) => {
      void task().catch((error) => reportError("Footer refresh failed", error));
    },
  };
  const [result, live] = await Promise.all([
    getReports(site, "30d", ["series"], deps, { audience: "public" }),
    // The word doesn't wait on the live band: without live numbers the band is left out.
    page.cards.includes("live")
      ? getLive(site).catch((error) => {
          reportError("Footer live numbers failed", error);
          return null;
        })
      : null,
  ]);

  const series = result.reports.series.data;
  const firstDay = site.propertyCreatedAt ? todayIn(site.timeZone, site.propertyCreatedAt) : null;
  const days = series ? lastDays(series, footer.days, result.window.today, firstDay) : null;
  if (!days) return null;

  const ticker = live
    ? tickerItems(live, {
        countries: page.cards.includes("countries"),
        pages: page.cards.includes("pages"),
        devices: page.cards.includes("devices"),
      })
    : [];
  return {
    label: site.domain ?? site.displayName,
    slug: page.slug,
    days,
    ticker,
    checkedAt: ticker.length > 0 ? new Date().toISOString() : null,
  };
}
