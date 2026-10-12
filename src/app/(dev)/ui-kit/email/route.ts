import { connection } from "next/server";
import { buildWeeklyEmail } from "@/lib/email/content";
import { uiKitEnabled } from "@/lib/env";
import { rangeWindow } from "@/lib/ga4/ranges";
import { sampleReports, SAMPLE_DOMAIN, SAMPLE_SIGNUP_EVENT } from "@/lib/ga4/sample/sample";
import { renderEmail } from "@/lib/jobs/weekly-email";

/** Dev only: the Monday email on sample data, as HTML (?text=1 for the plain-text part). */
export async function GET(request: Request) {
  await connection();
  if (!uiKitEnabled) return new Response("Not found", { status: 404 });
  const window = rangeWindow("7d", "UTC");
  const r = sampleReports(window, ["totals", "sources", "pages", "actions", "ai_sources"]);
  const data = buildWeeklyEmail({
    siteLabel: SAMPLE_DOMAIN,
    window,
    totals: r.totals.data,
    sources: r.sources.data,
    pages: r.pages.data,
    actions: r.actions.data,
    aiSources: r.ai_sources.data,
    signupEvent: SAMPLE_SIGNUP_EVENT,
    comparable: true,
    links: { dashboard: "/ui-kit/dashboard", settings: "/ui-kit", unsubscribe: "/ui-kit" },
  })!;
  const { html, text } = await renderEmail(data);
  const plain = new URL(request.url).searchParams.has("text");
  return new Response(plain ? `Subject: ${data.subject}\n\n${text}` : html, {
    headers: { "Content-Type": plain ? "text/plain; charset=utf-8" : "text/html; charset=utf-8" },
  });
}
