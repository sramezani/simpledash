import { AlertTriangleIcon, ChevronDownIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SiteIcon } from "@/components/shared/site-icon";
import { cardById } from "@/config/cards";
import { sourceDomain } from "@/lib/ga4/labels";
import { paymentReferrers, UNWANTED_REFERRALS_HELP } from "@/lib/ga4/payment-pages";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

type SourcesCardProps = {
  sources: Payloads["sources"] | null;
  channels: Payloads["channels"] | null;
  exportInfo: ListExport;
  dimmed?: boolean;
  /** Owner-only hints (the dashboard, never public pages): the payment-page warning. */
  ownerTips?: boolean;
};

const empty = <EmptyState title="No visitors in this period." />;

/** Sources | Channels (docs/SPEC.md section 11.4). */
export function SourcesCard({
  sources,
  channels,
  exportInfo,
  dimmed,
  ownerTips,
}: SourcesCardProps) {
  const card = cardById.sources;
  const payments = ownerTips ? paymentReferrers(sources?.rows ?? []) : [];
  return (
    <ListCard
      id="sources"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      intro={payments.length > 0 ? <PaymentWarning hosts={payments} /> : undefined}
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

/**
 * Payment pages listed as a source: GA4 gives those sales to the payment page instead
 * of where the buyer came from. Says how to fix it in GA4 (docs/SPEC.md section 28.3).
 */
function PaymentWarning({ hosts }: { hosts: string[] }) {
  const names = hosts.join(", ");
  return (
    <details className="group/pay rounded-lg border border-warning/40 bg-warning/5 text-xs">
      <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
        <span className="flex-1 text-pretty">
          <span className="font-medium">{names}</span> {hosts.length === 1 ? "is" : "are"} listed as
          a source, so GA4 gives some sales to the payment page instead of where the buyer came
          from.
        </span>
        <ChevronDownIcon
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open/pay:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="px-3 pb-2.5 pl-8 text-pretty text-muted-foreground">
        In Google Analytics, go to Admin → Data streams → your web stream → Configure tag settings →
        List unwanted referrals, and add {names}. Visits after that keep their real source.{" "}
        <a
          href={UNWANTED_REFERRALS_HELP}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Google&apos;s help
        </a>
      </p>
    </details>
  );
}
