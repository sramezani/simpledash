import { contentLlms } from "@/lib/content/source";

/** Every docs page, guide, glossary term and comparison in one Markdown file, for AI assistants. */
export async function GET() {
  return new Response(await contentLlms.full(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
