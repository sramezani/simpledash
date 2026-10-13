import { EmptyState } from "@/components/shared/empty-state";
import { TechIcon } from "@/components/shared/tech-icon";
import { cardById } from "@/config/cards";
import { browserIcons, deviceIcons, systemIcons } from "@/config/tech-icons";
import { formatShare } from "@/lib/format";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

type DevicesCardProps = {
  browsers: Payloads["browsers"] | null;
  systems: Payloads["systems"] | null;
  devices: Payloads["devices"] | null;
  exportInfo: ListExport;
  dimmed?: boolean;
};

const empty = <EmptyState title="No visitors in this period." />;

/** Rows with each one's share of the visitors in the list. */
function withShare<T extends { visitors: number }>(
  rows: T[] | undefined,
  row: (r: T) => { key: string; label: string; icon: React.ReactNode },
) {
  const kept = (rows ?? []).filter((r) => r.visitors > 0);
  const total = kept.reduce((a, r) => a + r.visitors, 0);
  return kept.map((r) => ({
    ...row(r),
    values: [r.visitors, r.visitors],
    display: [null, formatShare(r.visitors, total)],
  }));
}

/** Browser | OS | Device, each with its icon and share (docs/SPEC.md section 11.8). */
export function DevicesCard({ browsers, systems, devices, exportInfo, dimmed }: DevicesCardProps) {
  const card = cardById.devices;
  return (
    <ListCard
      id="devices"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      views={[
        {
          value: "browser",
          label: "Browser",
          itemLabel: "Browser",
          columns: ["Visitors", "Share"],
          empty,
          rows: withShare(browsers?.rows, (r) => ({
            key: r.label,
            label: r.label,
            icon: <TechIcon name={browserIcons[r.browser]} fallback="globe" />,
          })),
        },
        {
          value: "os",
          label: "OS",
          itemLabel: "Operating system",
          columns: ["Visitors", "Share"],
          empty,
          rows: withShare(systems?.rows, (r) => ({
            key: r.label,
            label: r.label,
            icon: <TechIcon name={systemIcons[r.os]} />,
          })),
        },
        {
          value: "device",
          label: "Device",
          itemLabel: "Device",
          columns: ["Visitors", "Share"],
          empty,
          rows: withShare(devices?.rows, (r) => ({
            key: r.device,
            label: r.label,
            icon: <TechIcon name={deviceIcons[r.device]} />,
          })),
        },
      ]}
    />
  );
}
