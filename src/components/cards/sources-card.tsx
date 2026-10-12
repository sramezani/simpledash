import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { RankedList } from "@/components/shared/ranked-list";
import { SiteIcon } from "@/components/shared/site-icon";
import { ViewToggle } from "@/components/shared/view-toggle";
import { cardById } from "@/config/cards";
import { sourceDomain } from "@/lib/ga4/labels";
import type { Payloads } from "@/lib/ga4/reports";

type SourcesCardProps = {
  sources: Payloads["sources"] | null;
  channels: Payloads["channels"] | null;
  dimmed?: boolean;
  actions?: ReactNode;
};

const empty = <EmptyState title="No visitors in this period." />;

/** Sources, with a Sources | Channels switch (docs/SPEC.md section 11.4). */
export function SourcesCard({ sources, channels, dimmed, actions }: SourcesCardProps) {
  const card = cardById.sources;
  const sourceRows = (sources?.rows ?? []).filter((r) => r.visitors > 0);
  const channelRows = (channels?.rows ?? []).filter((r) => r.visitors > 0);
  return (
    <CardShell id="sources" title={card.title} help={card.help} dimmed={dimmed} actions={actions}>
      <ViewToggle
        name="sources-view"
        label="Show sources or channels"
        views={[
          {
            value: "sources",
            label: "Sources",
            content: (
              <RankedList
                id="sources-list"
                empty={empty}
                itemLabel="Source"
                columns={["Visitors"]}
                rows={sourceRows.map((r) => ({
                  key: r.source,
                  label: r.label,
                  values: [r.visitors],
                  icon: (
                    <SiteIcon domain={sourceDomain(r.source)} direct={r.source === "(direct)"} />
                  ),
                }))}
              />
            ),
          },
          {
            value: "channels",
            label: "Channels",
            content: (
              <RankedList
                id="channels-list"
                empty={empty}
                itemLabel="Channel"
                columns={["Visitors"]}
                rows={channelRows.map((r) => ({
                  key: r.label,
                  label: r.label,
                  values: [r.visitors],
                }))}
              />
            ),
          },
        ]}
      />
    </CardShell>
  );
}
