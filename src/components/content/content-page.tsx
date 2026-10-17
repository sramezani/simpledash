import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { brand } from "@/config/theme";
import { type ContentPage, type ContentSection, markdownUrl, source } from "@/lib/content/source";
import { env } from "@/lib/env";
import { formatDay } from "@/lib/format";
import { breadcrumbList, contentArticle, jsonLd } from "@/lib/seo/structured-data";
import { getMDXComponents } from "./mdx";

/** The page for a section and the rest of its address, or a 404. */
export function findContentPage(section: ContentSection, slug: string[] | undefined): ContentPage {
  const page = source.getPage([section, ...(slug ?? [])]);
  if (!page) notFound();
  return page;
}

/** Every page of a section, for generateStaticParams (the hub's slug is empty). */
export function contentParams(section: ContentSection): { slug: string[] }[] {
  return source
    .getPages()
    .filter((page) => page.slugs[0] === section)
    .map((page) => ({ slug: page.slugs.slice(1) }));
}

/** Title, description, canonical address and social cards for a content page. */
export function contentMetadata(page: ContentPage): Metadata {
  const { title, seoTitle, description } = page.data;
  const image = `/content-og/${page.slugs.join("/")}/image.png`;
  return {
    title: seoTitle ?? title,
    description,
    alternates: { canonical: page.url },
    openGraph: {
      type: "article",
      title,
      description,
      url: page.url,
      modifiedTime: page.data.updated,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/**
 * A section's page for its address. Every page is prerendered (generateStaticParams), so the
 * fallback only shows while a page that wasn't built yet renders.
 */
export function ContentRoute({
  section,
  params,
}: {
  section: ContentSection;
  params: Promise<{ slug?: string[] }>;
}) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ContentFromParams section={section} params={params} />
    </Suspense>
  );
}

async function ContentFromParams({
  section,
  params,
}: {
  section: ContentSection;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <ContentPageView page={findContentPage(section, slug)} />;
}

function ContentSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-muted" />
      <div className="h-5 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-5 w-5/6 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

/** One docs page, guide, glossary term or comparison (docs/SPEC.md section 30). */
export function ContentPageView({ page }: { page: ContentPage }) {
  const MDX = page.data.body;
  const section = page.slugs[0] as ContentSection;
  const hub = page.slugs.length > 1 ? source.getPage([section]) : undefined;
  const crumbs = [
    ...(hub ? [{ name: hub.data.title, url: hub.url }] : []),
    { name: page.data.title, url: page.url },
  ];
  const githubUrl = `${brand.sourceUrl}/blob/main/content/${page.path}`;

  return (
    <DocsPage
      id="main"
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: "clerk" }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl(page)} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl(page)}
          githubUrl={githubUrl}
          pageUrl={`${env.APP_URL}${page.url}`}
        />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      <div className="flex flex-row flex-wrap items-center justify-between gap-4 border-t pt-6">
        <EditOnGitHub href={githubUrl} />
        <p className="text-sm text-fd-muted-foreground">
          Last updated{" "}
          <time dateTime={page.data.updated}>{formatDay(page.data.updated, true)}</time>
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            contentArticle({
              appUrl: env.APP_URL,
              url: page.url,
              title: page.data.title,
              description: page.data.description,
              updated: page.data.updated,
              technical: section === "docs",
            }),
            breadcrumbList(env.APP_URL, crumbs),
          ]),
        }}
      />
    </DocsPage>
  );
}
