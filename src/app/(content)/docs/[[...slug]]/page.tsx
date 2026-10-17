import type { Metadata } from "next";
import {
  ContentRoute,
  contentMetadata,
  contentParams,
  findContentPage,
} from "@/components/content/content-page";

/** /docs and its pages (docs/SPEC.md section 30). Prerendered. */
export default function Page({ params }: PageProps<"/docs/[[...slug]]">) {
  return <ContentRoute section="docs" params={params} />;
}

export function generateStaticParams() {
  return contentParams("docs");
}

export async function generateMetadata({
  params,
}: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  return contentMetadata(findContentPage("docs", slug));
}
