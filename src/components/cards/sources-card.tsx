import { EmptyState } from "@/components/shared/empty-state";
import { SiteIcon } from "@/components/shared/site-icon";
import { cardById } from "@/config/cards";
import { sourceDomain } from "@/lib/ga4/labels";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

type SourcesCardProps = {
  sources: Payloads["sources"] | null;
  channels: Payloads["channels"] | null;
  exportInfo: ListExport;
  dimmed?: boolean;
};

const empty = <EmptyState title="No visitors in this period." />;

/** Sources | Channels (docs/SPEC.md section 11.4). */
export function SourcesCard({ sources, channels, exportInfo, dimmed }: SourcesCardProps) {
  const card = cardById.sources;
  return (
    <ListCard
      id="sources"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      views={[
        {
          value: "sources",
          label: "Sources",
          itemLabel: "Source",
          columns: ["Visitors"],
          empty,
          rows: (sources?.rows ?? [])
            .filter((r) => r.visitors > 0)
            .map((r) => ({
              key: r.source,
              label: r.label,
              values: [r.visitors],
              icon: <SiteIcon domain={sourceDomain(r.source)} direct={r.source === "(direct)"} />,
            })),
        },
        {
          value: "channels",
          label: "Channels",
          itemLabel: "Channel",
          columns: ["Visitors"],
          empty,
          rows: (channels?.rows ?? [])
            .filter((r) => r.visitors > 0)
            .map((r) => ({ key: r.label, label: r.label, values: [r.visitors] })),
        },
      ]}
    />
  );
}
