import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { plans } from "@/config/plans";
import { formatPrice } from "@/lib/format";

/**
 * Guards for docs, guides, glossary and comparisons (docs/SPEC.md section 30, and the rules
 * in docs/CONTENT-PLAN.md section 15). They read the MDX files as text.
 */

const ROOT = join(process.cwd(), "content");
const SECTIONS = ["docs", "guides", "glossary", "compare"] as const;

type Page = { section: string; slug: string; url: string; file: string; text: string };

const pages: Page[] = SECTIONS.flatMap((section) =>
  readdirSync(join(ROOT, section))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      return {
        section,
        slug,
        url: slug === "index" ? `/${section}` : `/${section}/${slug}`,
        file: `content/${section}/${f}`,
        text: readFileSync(join(ROOT, section, f), "utf8"),
      };
    }),
);

function frontmatter(text: string): Record<string, string> {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  return Object.fromEntries(
    block
      .split("\n")
      .map((line) => /^(\w+):\s*(.*)$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [
        m[1],
        m[2]!
          .trim()
          .replace(/^"(.*)"$/, "$1")
          .replace(/\\"/g, '"'),
      ]),
  );
}

/** Heading anchors on a page: explicit `[#id]`, or the heading text made into an id. */
function anchors(text: string): Set<string> {
  const ids = new Set<string>();
  for (const m of text.matchAll(/^#{2,4} (.+)$/gm)) {
    const heading = m[1]!;
    const explicit = /\[#([\w-]+)\]\s*$/.exec(heading);
    if (explicit) ids.add(explicit[1]!);
    else
      ids.add(
        heading
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s/g, "-"),
      );
  }
  return ids;
}

/** App routes that content may link to, besides content pages. */
const APP_ROUTES = new Set([
  "/",
  "/demo",
  "/signin",
  "/privacy",
  "/terms",
  "/dashboard",
  "/settings",
]);

describe("content pages", () => {
  it("exist in every section", () => {
    for (const section of SECTIONS) {
      expect(
        pages.some((p) => p.section === section && p.slug === "index"),
        section,
      ).toBe(true);
    }
  });

  it("have a title, a 70–160 character description and an updated date", () => {
    for (const page of pages) {
      const fm = frontmatter(page.text);
      expect(fm.title, page.file).toBeTruthy();
      expect(fm.description?.length ?? 0, `${page.file} description`).toBeGreaterThanOrEqual(70);
      expect(fm.description?.length ?? 0, `${page.file} description`).toBeLessThanOrEqual(160);
      expect(fm.updated, page.file).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (fm.seoTitle) expect(fm.seoTitle.length, `${page.file} seoTitle`).toBeLessThanOrEqual(60);
      else expect(fm.title!.length, `${page.file}: add a seoTitle`).toBeLessThanOrEqual(60);
    }
  });

  it("quote frontmatter values that contain a colon, so YAML can read them", () => {
    for (const page of pages) {
      const block = /^---\n([\s\S]*?)\n---/.exec(page.text)?.[1] ?? "";
      for (const line of block.split("\n")) {
        const value = /^\w+:\s*(.*)$/.exec(line)?.[1] ?? "";
        if (value.includes(": ")) expect(value.startsWith('"'), `${page.file}: ${line}`).toBe(true);
      }
    }
  });

  it("never type a SimpleDash price or use the section sign", () => {
    const typedPrices = [plans.pro.prices.month, plans.pro.prices.year].map((p) => formatPrice(p));
    for (const page of pages) {
      for (const price of typedPrices) {
        expect(
          new RegExp(`\\${price}(?!\\d)`).test(page.text),
          `${page.file} types ${price}: use <Price />`,
        ).toBe(false);
      }
      expect(page.text.includes("§"), `${page.file} uses the section sign`).toBe(false);
    }
  });

  it("only link to pages, routes and headings that exist", () => {
    const byUrl = new Map(pages.map((p) => [p.url, p]));
    for (const page of pages) {
      const links = [
        ...page.text.matchAll(/\]\((\/[^)\s]*)\)/g),
        ...page.text.matchAll(/href="(\/[^"]*)"/g),
      ].map((m) => m[1]!);
      for (const link of links) {
        const [path, hash] = link.split("#") as [string, string | undefined];
        if (path === "/" && hash === "pricing") continue;
        const target = byUrl.get(path);
        expect(target !== undefined || APP_ROUTES.has(path), `${page.file} → ${link}`).toBe(true);
        if (target && hash) {
          expect(anchors(target.text).has(hash), `${page.file} → ${link} (no such heading)`).toBe(
            true,
          );
        }
      }
    }
  });

  it("are all in their section's menu, and the menu lists only pages that exist", () => {
    for (const section of SECTIONS) {
      const meta = JSON.parse(readFileSync(join(ROOT, section, "meta.json"), "utf8")) as {
        root: boolean;
        pages: string[];
      };
      expect(meta.root, section).toBe(true);
      const listed = meta.pages.filter((p) => !p.startsWith("---"));
      const files = pages.filter((p) => p.section === section).map((p) => p.slug);
      expect([...listed].sort(), section).toEqual([...files].sort());
    }
  });

  it("list every screenshot slot in docs/CONTENT-IMAGES.md", () => {
    const list = readFileSync(join(process.cwd(), "docs", "CONTENT-IMAGES.md"), "utf8");
    const ids = pages.flatMap((p) =>
      [...p.text.matchAll(/<ImageSlot\s+id="([\w-]+)"/g)].map((m) => m[1]!),
    );
    expect(new Set(ids).size, "image slot ids must be unique").toBe(ids.length);
    for (const id of ids)
      expect(list.includes(`\`${id}\``), `${id} missing from the list`).toBe(true);
  });
});
