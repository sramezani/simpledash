import { EmptyState } from "@/components/shared/empty-state";
import { cardById } from "@/config/cards";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

type PagesCardProps = {
  pages: Payloads["pages"] | null;
  landing: Payloads["landing"] | null;
  exportInfo: ListExport;
  dimmed?: boolean;
};

const empty = <EmptyState title="No page views in this period." />;

/** Top pages | Landing pages (docs/SPEC.md section 11.6). Paths are shown as they are. */
export function PagesCard({ pages, landing, exportInfo, dimmed }: PagesCardProps) {
  const card = cardById.pages;
  return (
    <ListCard
      id="pages"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      views={[
        {
          value: "top",
          label: "Top pages",
          itemLabel: "Page",
          columns: ["Views", "Visitors"],
          empty,
          rows: (pages?.rows ?? [])
            .filter((r) => r.views > 0)
            .map((r) => ({ key: r.path, label: r.path, values: [r.views, r.visitors] })),
        },
        {
          value: "landing",
          label: "Landing pages",
          itemLabel: "Landing page",
          columns: ["Visitors"],
          empty,
          rows: (landing?.rows ?? [])
            .filter((r) => r.visitors > 0)
            .map((r) => ({ key: r.path, label: r.path, values: [r.visitors] })),
        },
      ]}
    />
  );
}
