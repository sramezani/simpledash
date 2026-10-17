import type { Metadata } from "next";
import {
  ContentRoute,
  contentMetadata,
  contentParams,
  findContentPage,
} from "@/components/content/content-page";

/** /compare and its pages (docs/SPEC.md section 30). Prerendered. */
export default function Page({ params }: PageProps<"/compare/[[...slug]]">) {
  return <ContentRoute section="compare" params={params} />;
}

export function generateStaticParams() {
  return contentParams("compare");
}

export async function generateMetadata({
  params,
}: PageProps<"/compare/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  return contentMetadata(findContentPage("compare", slug));
}
