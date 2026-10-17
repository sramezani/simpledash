import type * as PageTree from "fumadocs-core/page-tree";
import { loader } from "fumadocs-core/source";
import { llms } from "fumadocs-core/source/llms";
import { content } from "@/lib/content/collections";
import { contentToMarkdown } from "@/lib/content/markdown";
import { env } from "@/lib/env";

/** Docs, guides, glossary and comparisons as pages and one menu tree (docs/SPEC.md section 30). */
export const source = loader({ baseUrl: "/", source: content.toFumadocsSource() });

export type ContentPage = NonNullable<ReturnType<typeof source.getPage>>;

/** The menu tree, with each page's short `menuTitle` where it has one (titles are written for search). */
export function menuTree(): PageTree.Root {
  const rename = (node: PageTree.Node): PageTree.Node => {
    if (node.type === "page") {
      const menuTitle = source.getPageByHref(node.url)?.page.data.menuTitle;
      return menuTitle ? { ...node, name: menuTitle } : node;
    }
    if (node.type === "folder") {
      return {
        ...node,
        index: node.index ? (rename(node.index) as PageTree.Item) : undefined,
        children: node.children.map(rename),
      };
    }
    return node;
  };
  const tree = source.getPageTree();
  return { ...tree, children: tree.children.map(rename) };
}

/** The four sections, each a root folder (a tab above the menu) with its own address. */
export const contentSections = ["docs", "guides", "glossary", "compare"] as const;
export type ContentSection = (typeof contentSections)[number];

/** A page's Markdown address: its own address plus ".md" (rewritten in next.config.ts). */
export const markdownUrl = (page: Pick<ContentPage, "url">) => `${page.url}.md`;

/**
 * Markdown for AI assistants: one page, or every page (llms-full.txt). Links are made
 * absolute, so a copy read on its own still points at the right pages.
 */
export const contentLlms = llms(source, {
  renderPage: async (page) => {
    const body = contentToMarkdown(await page.data.getText("processed"));
    return `# ${page.data.title}\n\nURL: ${env.APP_URL}${page.url}\n\n${page.data.description}\n\n${body.replaceAll("](/", `](${env.APP_URL}/`)}`;
  },
});
