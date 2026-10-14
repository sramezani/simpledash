import { connection } from "next/server";
import { csvCardIds, type CardId } from "@/config/cards";
import { findOpenSite, getApiUser } from "@/lib/auth/session";
import { csvFilename, toCsv } from "@/lib/csv";
import { csvReports, csvTable } from "@/lib/csv-cards";
import { loadReports } from "@/lib/ga4/data";
import { getPlan } from "@/lib/billing/billing";
import { entitlements } from "@/lib/billing/plan";
import { parseRange, rangeForPlan } from "@/lib/ga4/ranges";

/**
 * "Download CSV" for a card (docs/SPEC.md section 13): /api/csv/<card>?site=<id>&range=30d.
 * Built from the same cached reports as the dashboard; only the user's own sites
 * that their plan opens, and on Free only the last 30 days.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/csv/[card]">) {
  await connection();
  const user = await getApiUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const { card } = await ctx.params;
  if (!(csvCardIds as readonly string[]).includes(card))
    return new Response("Not found", { status: 404 });
  const search = new URL(request.url).searchParams;
  const site = await findOpenSite(user.id, search.get("site"));
  if (!site) return new Response("Connect a Google Analytics site first.", { status: 404 });

  const id = card as CardId;
  const { fullHistory } = entitlements(await getPlan(user.id));
  const { range } = rangeForPlan(parseRange(search.get("range")), fullHistory, site.timeZone);
  const result = await loadReports(site, range, csvReports[id] ?? []);
  const data = Object.fromEntries(Object.entries(result.reports).map(([r, v]) => [r, v.data]));
  const table = csvTable(id, data, result.window, site.signupEvent);
  if (!table) return new Response("No data for this card yet.", { status: 404 });

  const name = csvFilename(
    site.domain ?? site.displayName,
    id,
    result.window.current.start,
    result.window.current.end,
  );
  return new Response(toCsv(table.header, table.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
