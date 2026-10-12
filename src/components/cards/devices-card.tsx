import { CircleHelpIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { RankedList } from "@/components/shared/ranked-list";
import { cardById } from "@/config/cards";
import { formatShare } from "@/lib/format";
import type { Payloads } from "@/lib/ga4/reports";

const icons = {
  desktop: MonitorIcon,
  mobile: SmartphoneIcon,
  tablet: TabletIcon,
  other: CircleHelpIcon,
};

/** Desktop, Mobile and Tablet, each with a share bar (docs/SPEC.md section 11.8). */
export function DevicesCard({
  devices,
  dimmed,
  actions,
}: {
  devices: Payloads["devices"] | null;
  dimmed?: boolean;
  actions?: ReactNode;
}) {
  const card = cardById.devices;
  const rows = (devices?.rows ?? []).filter((r) => r.visitors > 0);
  const total = rows.reduce((a, r) => a + r.visitors, 0);
  return (
    <CardShell id="devices" title={card.title} help={card.help} dimmed={dimmed} actions={actions}>
      {rows.length ? (
        <RankedList
          id="devices-list"
          itemLabel="Device"
          columns={["Visitors", "Share"]}
          rows={rows.map((r) => {
            const Icon = icons[r.device];
            return {
              key: r.device,
              label: r.label,
              values: [r.visitors, r.visitors],
              display: [null, formatShare(r.visitors, total)],
              icon: <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />,
            };
          })}
        />
      ) : (
        <EmptyState title="No visitors in this period." />
      )}
    </CardShell>
  );
}
