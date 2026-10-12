import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { RankedList } from "@/components/shared/ranked-list";
import { ViewToggle } from "@/components/shared/view-toggle";
import { cardById } from "@/config/cards";
import type { Payloads } from "@/lib/ga4/reports";

type PagesCardProps = {
  pages: Payloads["pages"] | null;
  landing: Payloads["landing"] | null;
  dimmed?: boolean;
  actions?: ReactNode;
};

const empty = <EmptyState title="No page views in this period." />;

/** Top pages and landing pages (docs/SPEC.md section 11.6). Paths are shown as they are. */
export function PagesCard({ pages, landing, dimmed, actions }: PagesCardProps) {
  const card = cardById.pages;
  const top = (pages?.rows ?? []).filter((r) => r.views > 0);
  const entries = (landing?.rows ?? []).filter((r) => r.visitors > 0);
  return (
    <CardShell id="pages" title={card.title} help={card.help} dimmed={dimmed} actions={actions}>
      <ViewToggle
        name="pages-view"
        label="Show top pages or landing pages"
        views={[
          {
            value: "top",
            label: "Top pages",
            content: top.length ? (
              <RankedList
                id="pages-list"
                itemLabel="Page"
                columns={["Views", "Visitors"]}
                rows={top.map((r) => ({
                  key: r.path,
                  label: r.path,
                  values: [r.views, r.visitors],
                }))}
              />
            ) : (
              empty
            ),
          },
          {
            value: "landing",
            label: "Landing pages",
            content: entries.length ? (
              <RankedList
                id="landing-list"
                itemLabel="Landing page"
                columns={["Visitors"]}
                rows={entries.map((r) => ({ key: r.path, label: r.path, values: [r.visitors] }))}
              />
            ) : (
              empty
            ),
          },
        ]}
      />
    </CardShell>
  );
}
