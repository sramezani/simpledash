import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { legal } from "@/config/legal";
import { env } from "@/lib/env";
import { listIndexablePublicPages } from "@/lib/public-page/view";

/** sitemap.xml (docs/SPEC.md section 17): landing, legal, and public pages that are on, indexable and not paused. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // public pages come from the database at request time
  const base = env.APP_URL;
  const legalUpdated = new Date(`${legal.lastUpdated}T00:00:00Z`);
  const publicPages = await listIndexablePublicPages().catch(() => []);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/privacy`,
      lastModified: legalUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${base}/terms`, lastModified: legalUpdated, changeFrequency: "yearly", priority: 0.3 },
    ...publicPages.map((p) => ({
      url: `${base}/p/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
