import { pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { z } from "zod";

/**
 * The content collection (docs/SPEC.md section 30): MDX files in content/, one folder per
 * section, compiled at build time by Fumadocs MDX's Macro API. Kept alone in this module,
 * because the macro evaluates the whole module that defines it.
 */
export const content = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema.extend({
      description: z.string().min(70).max(160),
      /** A short label for the menu on the left, when the title is long. */
      menuTitle: z.string().max(36).optional(),
      /** The <title> when the H1 is too long for search results. */
      seoTitle: z.string().max(60).optional(),
      /** Moved only when the page really changed. */
      updated: z.iso.date(),
    }),
    // The Markdown copies for AI assistants come from the processed content.
    postprocess: { includeProcessedMarkdown: true },
  },
});
