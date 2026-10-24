import { connection } from "next/server";
import { findOpenSite, getApiUser } from "@/lib/auth/session";
import { classifyError } from "@/lib/ga4/errors";
import { LIVE_EARLY } from "@/lib/ga4/freshness";
import { getLive, getLiveCount } from "@/lib/ga4/realtime";

const noStore = { "Cache-Control": "private, no-store" };

/**
 * Live data for one of the signed-in user's own sites (docs/SPEC.md section 11.10): ?site=<id>
 * gives the live count in the overview, and ?site=<id>&view=full everything the live view shows.
 * The dashboard's one early ask adds &fresh=1: an answer at most 5 seconds old, not 20.
 */
export async function GET(request: Request) {
  await connection();
  const user = await getApiUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401, headers: noStore });
  const params = new URL(request.url).searchParams;
  const site = await findOpenSite(user.id, params.get("site"));
  if (!site || site.status !== "ok") {
    return Response.json({ error: "No site to show." }, { status: 409, headers: noStore });
  }
  try {
    const data =
      params.get("view") === "full"
        ? await getLive(site)
        : await getLiveCount(site, Date.now(), params.has("fresh") ? LIVE_EARLY : undefined);
    return Response.json(data, { headers: noStore });
  } catch (error) {
    const { problem } = classifyError(error);
    return Response.json({ error: problem }, { status: 503, headers: noStore });
  }
}
