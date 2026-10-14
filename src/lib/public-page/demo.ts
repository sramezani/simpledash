import "server-only";
import { publicCardIds } from "@/config/cards";
import { demo } from "@/config/demo";
import { comparisonGap, rangeWindow, type RangeType } from "@/lib/ga4/ranges";
import { REPORTS } from "@/lib/ga4/reports";
import { sampleReports, SAMPLE_DOMAIN, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";
import { getPublicView, type PublicView } from "./view";

type LiveView = Extract<PublicView, { kind: "live" }>;

/**
 * What /demo shows: the configured public page (src/config/demo.ts), or sample data
 * when that page is missing or paused, so the landing page's demo never breaks.
 */
export async function getDemoView(range: RangeType, now?: Date): Promise<LiveView> {
  const view = await getPublicView(demo.slug, range, true);
  if (view.kind === "live") return view;
  const window = rangeWindow(range, "UTC", now ?? new Date());
  return {
    kind: "live",
    label: SAMPLE_DOMAIN,
    slug: demo.slug,
    // Every card but "Right now", which needs a real site.
    cards: publicCardIds.filter((id) => id !== "live"),
    indexable: false,
    range,
    window,
    reports: sampleReports(window, REPORTS),
    signupEvent: SAMPLE_SIGNUP_EVENT,
    comparisonGap: comparisonGap(window, null),
    customLimited: false,
    poweredBy: true,
    fullHistory: true,
  };
}
