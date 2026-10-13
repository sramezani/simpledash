import { SparklesIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { cardById } from "@/config/cards";
import { formatNumber } from "@/lib/format";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

type AiCardProps = {
  sources: Payloads["ai_sources"] | null;
  pages: Payloads["ai_pages"] | null;
  exportInfo: ListExport;
  dimmed?: boolean;
};

/** Visitors from AI assistants, by assistant, and the pages they landed on (docs/SPEC.md section 11.5). */
export function AiCard({ sources, pages, exportInfo, dimmed }: AiCardProps) {
  const card = cardById.ai;
  const assistants = (sources?.rows ?? []).filter((r) => r.visitors > 0);
  const landed = (pages?.rows ?? []).filter((r) => r.visitors > 0);
  const total = assistants.reduce((a, r) => a + r.visitors, 0);
  return (
    <ListCard
      id="ai"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      initial={9}
      intro={
        <p className="text-sm text-muted-foreground">
          <span className="text-2xl font-semibold text-foreground tabular-nums">
            {formatNumber(total)}
          </span>{" "}
          {total === 1 ? "visitor" : "visitors"} from AI assistants
        </p>
      }
      views={[
        {
          value: "assistants",
          label: "Assistants",
          itemLabel: "Assistant",
          columns: ["Visitors"],
          empty: null,
          rows: assistants.map((r) => ({
            key: r.assistant,
            label: r.assistant,
            values: [r.visitors],
          })),
        },
        {
          value: "pages",
          label: "Pages",
          itemLabel: "Landing page",
          columns: ["Visitors"],
          empty: <EmptyState title="No landing pages recorded." />,
          rows: landed.map((r) => ({ key: r.path, label: r.path, values: [r.visitors] })),
        },
      ]}
    >
      {assistants.length === 0 ? (
        <EmptyState icon={SparklesIcon} title="No visitors from AI assistants in this period." />
      ) : undefined}
    </ListCard>
  );
}
