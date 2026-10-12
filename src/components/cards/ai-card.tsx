import { SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { RankedList } from "@/components/shared/ranked-list";
import { ViewToggle } from "@/components/shared/view-toggle";
import { cardById } from "@/config/cards";
import { formatNumber } from "@/lib/format";
import type { Payloads } from "@/lib/ga4/reports";

type AiCardProps = {
  sources: Payloads["ai_sources"] | null;
  pages: Payloads["ai_pages"] | null;
  dimmed?: boolean;
  actions?: ReactNode;
};

/** Visitors from AI assistants, by assistant, and the pages they landed on (docs/SPEC.md section 11.5). */
export function AiCard({ sources, pages, dimmed, actions }: AiCardProps) {
  const card = cardById.ai;
  const assistants = (sources?.rows ?? []).filter((r) => r.visitors > 0);
  const landed = (pages?.rows ?? []).filter((r) => r.visitors > 0);
  const total = assistants.reduce((a, r) => a + r.visitors, 0);
  return (
    <CardShell id="ai" title={card.title} help={card.help} dimmed={dimmed} actions={actions}>
      {assistants.length === 0 ? (
        <EmptyState icon={SparklesIcon} title="No visitors from AI assistants in this period." />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-2xl font-semibold text-foreground tabular-nums">
              {formatNumber(total)}
            </span>{" "}
            {total === 1 ? "visitor" : "visitors"} from AI assistants
          </p>
          <ViewToggle
            name="ai-view"
            label="Show assistants or pages"
            views={[
              {
                value: "assistants",
                label: "Assistants",
                content: (
                  <RankedList
                    id="ai-list"
                    itemLabel="Assistant"
                    columns={["Visitors"]}
                    rows={assistants.map((r) => ({
                      key: r.assistant,
                      label: r.assistant,
                      values: [r.visitors],
                    }))}
                  />
                ),
              },
              {
                value: "pages",
                label: "Pages",
                content: landed.length ? (
                  <RankedList
                    id="ai-pages-list"
                    itemLabel="Landing page"
                    columns={["Visitors"]}
                    rows={landed.map((r) => ({ key: r.path, label: r.path, values: [r.visitors] }))}
                  />
                ) : (
                  <EmptyState title="No landing pages recorded." />
                ),
              },
            ]}
          />
        </div>
      )}
    </CardShell>
  );
}
