import { EmptyState } from "@/components/shared/empty-state";
import { Flag } from "@/components/shared/flag";
import { cardById } from "@/config/cards";
import { formatShare } from "@/lib/format";
import type { Payloads } from "@/lib/ga4/reports";
import { ListCard, type ListExport } from "./list-card";

type CountriesCardProps = {
  countries: Payloads["countries"] | null;
  cities: Payloads["cities"] | null;
  /** All visitors in the period, for each country's share. */
  total: number | null;
  exportInfo: ListExport;
  dimmed?: boolean;
};

const empty = <EmptyState title="No visitors in this period." />;

/** Country | City, with flags (docs/SPEC.md section 11.7). */
export function CountriesCard({
  countries,
  cities,
  total,
  exportInfo,
  dimmed,
}: CountriesCardProps) {
  const card = cardById.countries;
  const countryRows = (countries?.rows ?? []).filter((r) => r.visitors > 0);
  const sum = total ?? countryRows.reduce((a, r) => a + r.visitors, 0);
  return (
    <ListCard
      id="countries"
      title={card.title}
      help={card.help}
      exportInfo={exportInfo}
      dimmed={dimmed}
      views={[
        {
          value: "country",
          label: "Country",
          itemLabel: "Country",
          columns: ["Visitors", "Share"],
          empty,
          rows: countryRows.map((r) => ({
            key: r.code || r.name,
            label: r.name,
            values: [r.visitors, r.visitors],
            display: [null, formatShare(r.visitors, sum)],
            icon: <Flag code={r.code} />,
          })),
        },
        {
          value: "city",
          label: "City",
          itemLabel: "City",
          columns: ["Visitors"],
          empty,
          rows: (cities?.rows ?? [])
            .filter((r) => r.visitors > 0)
            .map((r) => ({
              key: `${r.code}|${r.city}`,
              label: r.city,
              values: [r.visitors],
              icon: <Flag code={r.code} />,
            })),
        },
      ]}
    />
  );
}
