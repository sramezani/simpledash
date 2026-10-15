import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** robots.txt (docs/SPEC.md section 17): public pages in, the app and APIs out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/p/", "/llms.txt"],
      disallow: [
        "/dashboard",
        "/settings",
        "/admin",
        "/signin",
        "/api/",
        "/email/",
        "/ui-kit",
        "/account-deleted",
      ],
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}
