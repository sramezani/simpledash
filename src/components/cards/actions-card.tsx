import {
  DownloadIcon,
  ExternalLinkIcon,
  MousePointerClickIcon,
  SendIcon,
  UserPlusIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { cardById } from "@/config/cards";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

const HELP = "https://support.google.com/analytics/answer/9216061";

type ActionsCardProps = {
  /** Event counts from the `actions` report. */
  counts: Payloads["actions"] | null;
  signupEvent: string | null;
  exportInfo: ListExport;
  dimmed?: boolean;
};

/** Downloads, outbound clicks, form submits and signups. Zero rows are hidden (docs/SPEC.md section 11.9). */
export function ActionsCard({ counts, signupEvent, exportInfo, dimmed }: ActionsCardProps) {
  const card = cardById.actions;
  const count = (event: string) => counts?.current[event] ?? 0;
  const rows = [
    { key: "file_download", label: "Downloads", icon: DownloadIcon },
    { key: "click", label: "Outbound clicks", icon: ExternalLinkIcon },
    { key: "form_submit", label: "Form submits", icon: SendIcon },
    ...(signupEvent && !["file_download", "click", "form_submit"].includes(signupEvent)
      ? [{ key: signupEvent, label: "Signups", icon: UserPlusIcon }]
      : []),
  ]
    .map((row) => ({ ...row, value: count(row.key) }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <ListCard
      id="actions"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      views={[
        {
          value: "actions",
          label: "Actions",
          itemLabel: "Action",
          columns: ["Count"],
          rows: rows.map((row) => ({
            key: row.key,
            label: row.label,
            values: [row.value],
            icon: <row.icon className="size-3.5 text-muted-foreground" aria-hidden="true" />,
          })),
          empty: (
            <EmptyState icon={MousePointerClickIcon} title="No actions recorded yet.">
              Turn on Enhanced Measurement in Google Analytics to count downloads, outbound clicks
              and forms.{" "}
              <a
                href={HELP}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                How to turn it on
              </a>
            </EmptyState>
          ),
        },
      ]}
    />
  );
}
