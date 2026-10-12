import { connection } from "next/server";
import { GENERIC_ICON, getSiteIcon, isIconDomain } from "@/lib/site-icons";

const MONTH = 60 * 60 * 24 * 30;
const cached = `public, max-age=${MONTH}, s-maxage=${MONTH}, immutable`;

/** Site icon proxy: /api/icon/<domain> (docs/SPEC.md section 19). */
export async function GET(_request: Request, ctx: RouteContext<"/api/icon/[domain]">) {
  await connection();
  const { domain } = await ctx.params;
  let name = "";
  try {
    name = decodeURIComponent(domain).toLowerCase();
  } catch {
    // A malformed address gets the generic icon below.
  }
  const icon = name && isIconDomain(name) ? await getSiteIcon(name) : null;
  if (icon) {
    return new Response(icon.body, {
      headers: {
        "Content-Type": icon.type,
        "Cache-Control": cached,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  return new Response(GENERIC_ICON, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${60 * 60 * 24}, s-maxage=${60 * 60 * 24}`,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
