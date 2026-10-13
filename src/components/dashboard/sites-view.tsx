import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { TopBar } from "./top-bar";

/**
 * All sites (`/sites`, docs/SPEC.md section 28.1): one card per site in the list,
 * then "Add a site". For Starter and trials, the upgrade panel comes first.
 */
export function SitesView({
  cards,
  add,
  upgrade,
  note,
  basePath,
}: {
  /** One card per site, each streamed on its own. */
  cards: ReactNode;
  /** The dashed "Add a site" card, while below the limit. */
  add?: ReactNode;
  /** "Several sites are part of Growth", for Starter and trials. */
  upgrade?: ReactNode;
  /** A line under the heading, e.g. a notice after removing a site. */
  note?: ReactNode;
  basePath?: "/dashboard" | "/ui-kit/dashboard";
}) {
  return (
    <>
      <TopBar basePath={basePath} />
      <main id="main" className="pb-16">
        <Container className="flex flex-col gap-5 pt-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">All sites</h1>
            <p className="text-sm text-muted-foreground">
              Visitors in the last 7 days, compared with the 7 days before. Google may still be
              adding to yesterday.
            </p>
          </div>
          {note}
          {upgrade}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards}
            {add}
          </div>
        </Container>
      </main>
    </>
  );
}
