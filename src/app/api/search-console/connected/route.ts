import type { Route } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { findOpenSite, getApiUser } from "@/lib/auth/session";
import { autoConnect } from "@/lib/search-console/connect";
import { getSiteContext } from "@/lib/sites/sites";

/**
 * Where Google sends the user back after granting Search Console access
 * (docs/SPEC.md section 28.2): picks the matching property, then returns to the
 * dashboard or Settings with the result.
 */
export async function GET(request: Request) {
  await connection();
  const user = await getApiUser();
  if (!user) redirect("/signin");
  const search = new URL(request.url).searchParams;
  const back = search.get("back") === "dashboard" ? "dashboard" : "settings";
  const site = await findOpenSite(user.id, search.get("site"));
  if (!site) redirect("/settings");
  const { ent } = await getSiteContext(user.id);
  const result = ent.searchConsole ? await autoConnect(site) : "upgrade";
  redirect(
    (back === "dashboard"
      ? `/dashboard?site=${site.id}&search=${result}`
      : `/settings?site=${site.id}&search=${result}#search`) as Route,
  );
}
