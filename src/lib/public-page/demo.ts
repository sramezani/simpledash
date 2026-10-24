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
 * `sample` says which, so the demo can give the sample its still live view.
 */
export async function getDemoView(
  range: RangeType,
  now?: Date,
): Promise<{ view: LiveView; sample: boolean }> {
  const view = await getPublicView(demo.slug, range, true);
  if (view.kind === "live") return { view, sample: false };
  const window = rangeWindow(range, "UTC", now ?? new Date());
  const sampleView: LiveView = {
    kind: "live",
    label: SAMPLE_DOMAIN,
    slug: demo.slug,
    // Every card, "Right now" too: the demo shows it with sampleLive.
    cards: [...publicCardIds],
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
  return { view: sampleView, sample: true };
}
