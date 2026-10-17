import type { Metadata } from "next";
import {
  ContentRoute,
  contentMetadata,
  contentParams,
  findContentPage,
} from "@/components/content/content-page";

/** /glossary and its pages (docs/SPEC.md section 30). Prerendered. */
export default function Page({ params }: PageProps<"/glossary/[[...slug]]">) {
  return <ContentRoute section="glossary" params={params} />;
}

export function generateStaticParams() {
  return contentParams("glossary");
}

export async function generateMetadata({
  params,
}: PageProps<"/glossary/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  return contentMetadata(findContentPage("glossary", slug));
}
