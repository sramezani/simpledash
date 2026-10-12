import { env } from "@/lib/env";
import { llmsText } from "@/lib/seo/llms";

/** /llms.txt: static, built from plans.ts and the theme file. */
export function GET() {
  return new Response(llmsText(env.APP_URL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
