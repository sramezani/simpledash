import { notFound } from "next/navigation";
import { contentLlms, source } from "@/lib/content/source";

/**
 * The Markdown copy of a content page, for AI assistants (docs/SPEC.md section 30).
 * Reached as /docs/plans.md through a rewrite in next.config.ts: the rewrite appends
 * "content.md", which is dropped here.
 */
export async function GET(_request: Request, { params }: RouteContext<"/llms.mdx/[...slug]">) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  return new Response(await contentLlms.page(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, "content.md"] }));
}
