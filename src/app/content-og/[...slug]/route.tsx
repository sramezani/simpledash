import { notFound } from "next/navigation";
import { contentOgImage } from "@/components/content/og-image";
import { source } from "@/lib/content/source";

/**
 * Social images for content pages (docs/SPEC.md section 30): /content-og/<page>/image.png.
 * A route of its own, because Next.js allows no image file under a catch-all route.
 */
export async function GET(_request: Request, { params }: RouteContext<"/content-og/[...slug]">) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  return contentOgImage(page);
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, "image.png"] }));
}
