import type { Metadata } from "next";
import {
  ContentRoute,
  contentMetadata,
  contentParams,
  findContentPage,
} from "@/components/content/content-page";

/** /guides and its pages (docs/SPEC.md section 30). Prerendered. */
export default function Page({ params }: PageProps<"/guides/[[...slug]]">) {
  return <ContentRoute section="guides" params={params} />;
}

export function generateStaticParams() {
  return contentParams("guides");
}

export async function generateMetadata({
  params,
}: PageProps<"/guides/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  return contentMetadata(findContentPage("guides", slug));
}
