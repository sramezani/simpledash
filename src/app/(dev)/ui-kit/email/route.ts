import { connection } from "next/server";
import { buildWeeklyEmail, type SiteWeekInput } from "@/lib/email/content";
import { uiKitEnabled } from "@/lib/env";
import { lastWeekRange, rangeWindow } from "@/lib/ga4/ranges";
import { sampleReports, SAMPLE_DOMAIN, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";
import { renderEmail } from "@/lib/jobs/weekly-email";

const EXTRA_SITES = [
  { label: "blog.yoursite.com", scale: 0.35 },
  { label: "docs.yoursite.com", scale: 0.12 },
];

/**
 * Dev only: the Monday email on sample data, as HTML (?text=1 for the plain-text part,
 * ?sites=3 for an account with several sites).
 */
export async function GET(request: Request) {
  await connection();
  if (!uiKitEnabled) return new Response("Not found", { status: 404 });
  const search = new URL(request.url).searchParams;
  const window = rangeWindow(lastWeekRange("UTC"), "UTC");
  const r = sampleReports(window, ["totals", "sources", "pages", "actions", "ai_sources"]);
  const main: SiteWeekInput = {
    siteLabel: SAMPLE_DOMAIN,
    window,
    totals: r.totals.data,
    sources: r.sources.data,
    pages: r.pages.data,
    actions: r.actions.data,
    aiSources: r.ai_sources.data,
    signupEvent: SAMPLE_SIGNUP_EVENT,
    comparable: true,
    dashboard: "/ui-kit/dashboard",
  };
  const count = Math.min(Math.max(Number(search.get("sites")) || 1, 1), EXTRA_SITES.length + 1);
  const extra = EXTRA_SITES.slice(0, count - 1).map(({ label, scale }, i) => {
    const t = r.totals.data;
    const times = (n: number) => Math.round(n * scale);
    return {
      ...main,
      siteLabel: label,
      dashboard: `/ui-kit/dashboard?site=${i + 2}`,
      totals: {
        current: { ...t.current, visitors: times(t.current.visitors) },
        previous: { ...t.previous, visitors: times(t.previous.visitors * (1.1 - i * 0.3)) },
      },
      sources: { rows: r.sources.data.rows.map((s) => ({ ...s, visitors: times(s.visitors) })) },
      pages: { rows: r.pages.data.rows.map((p) => ({ ...p, views: times(p.views) })) },
    };
  });
  const data = buildWeeklyEmail({
    sites: [main, ...extra],
    links: { settings: "/ui-kit", unsubscribe: "/ui-kit" },
  })!;
  const { html, text } = await renderEmail(data);
  const plain = search.has("text");
  return new Response(plain ? `Subject: ${data.subject}\n\n${text}` : html, {
    headers: { "Content-Type": plain ? "text/plain; charset=utf-8" : "text/html; charset=utf-8" },
  });
}
