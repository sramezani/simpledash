import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/content/source";

/** Search over docs, guides, glossary and comparisons (docs/SPEC.md section 30). */
export const { GET } = createFromSource(source, { language: "english" });
