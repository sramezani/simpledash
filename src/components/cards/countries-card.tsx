import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Flag } from "@/components/shared/flag";
import { RankedList } from "@/components/shared/ranked-list";
import { cardById } from "@/config/cards";
import { formatShare } from "@/lib/format";
import type { Payloads } from "@/lib/ga4/reports";

type CountriesCardProps = {
  countries: Payloads["countries"] | null;
  /** All visitors in the period, for each country's share. */
  total: number | null;
  dimmed?: boolean;
  actions?: ReactNode;
};

/** Countries with flags and share (docs/SPEC.md section 11.7). */
export function CountriesCard({ countries, total, dimmed, actions }: CountriesCardProps) {
  const card = cardById.countries;
  const rows = (countries?.rows ?? []).filter((r) => r.visitors > 0);
  const sum = total ?? rows.reduce((a, r) => a + r.visitors, 0);
  return (
    <CardShell id="countries" title={card.title} help={card.help} dimmed={dimmed} actions={actions}>
      <RankedList
        id="countries-list"
        empty={<EmptyState title="No visitors in this period." />}
        itemLabel="Country"
        columns={["Visitors", "Share"]}
        rows={rows.map((r) => ({
          key: r.code || r.name,
          label: r.name,
          values: [r.visitors, r.visitors],
          display: [null, formatShare(r.visitors, sum)],
          icon: <Flag code={r.code} />,
        }))}
      />
    </CardShell>
  );
}
