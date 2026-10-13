import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db/client";
import { publicPage, type Site } from "@/lib/db/schema";
import { getLive } from "@/lib/ga4/realtime";
import { publicSiteOf } from "@/lib/public-page/view";

// Which site a slug's live card shows, kept 60 seconds like the live numbers, so a
// busy public page doesn't send every visitor's poll to the database.
const lookups = new Map<string, { site: Site | null; until: number }>();
const LOOKUP_MS = 60_000;

async function liveSiteFor(slug: string): Promise<Site | null> {
  const hit = lookups.get(slug);
  if (hit && hit.until > Date.now()) return hit.site;
  let found: Site | null = null;
  const page = await db.query.publicPage.findFirst({ where: eq(publicPage.slug, slug) });
  if (page?.enabled && page.cards.includes("live")) {
    const resolved = await publicSiteOf(page);
    if (resolved && !resolved.paused) found = resolved.site;
  }
  if (lookups.size > 1000) lookups.clear();
  lookups.set(slug, { site: found, until: Date.now() + LOOKUP_MS });
  return found;
}

/** Live data for a public page with the "Right now" card turned on. Shares the 60-second cache. */
export async function GET(_request: Request, ctx: RouteContext<"/api/p/[slug]/live">) {
  await connection();
  const { slug } = await ctx.params;
  if (slug.length > 40) return new Response("Not found", { status: 404 });
  const owned = await liveSiteFor(slug);
  if (!owned) return new Response("Not found", { status: 404 });
  try {
    const live = await getLive(owned);
    return Response.json(live, { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } });
  } catch {
    return Response.json({ error: "Live numbers aren't available right now." }, { status: 503 });
  }
}
