import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { legal } from "@/config/legal";
import { formatDay } from "@/lib/format";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Layout for the privacy policy and terms: readable width, real headings. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="py-12">
        <Container className="max-w-3xl">
          <article className="legal flex flex-col gap-4 text-pretty">
            <header className="flex flex-col gap-2 pb-4">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">
                Last updated {formatDay(legal.lastUpdated, true)}
              </p>
              <p className="text-muted-foreground">{intro}</p>
            </header>
            {children}
          </article>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  /** For links to this section, e.g. /privacy#analytics. */
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3 pt-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 leading-relaxed [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
