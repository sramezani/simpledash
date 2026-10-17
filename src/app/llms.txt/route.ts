import { source } from "@/lib/content/source";
import { env } from "@/lib/env";
import { llmsText } from "@/lib/seo/llms";

/** /llms.txt: static, built from plans.ts, the theme file and the content pages. */
export function GET() {
  const pages = source.getPages().map((page) => ({
    section: page.slugs[0] ?? "",
    title: page.data.title,
    url: page.url,
    description: page.data.description,
  }));
  return new Response(llmsText(env.APP_URL, pages), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
