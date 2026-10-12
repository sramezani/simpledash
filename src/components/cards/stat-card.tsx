import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { Delta } from "@/components/shared/delta";
import { StatValue } from "@/components/shared/stat-value";
import { cardById, type CardId } from "@/config/cards";

type StatCardProps = {
  id: Extract<CardId, "visitors" | "page-views" | "avg-time" | "signups">;
  /** The formatted value, or null for "—". */
  value: string | null;
  change: number | null;
  /** Why there is no % change. */
  missing?: string;
  /** "vs the previous 7 days", for screen readers. */
  versus: string;
  dimmed?: boolean;
  actions?: ReactNode;
  /** Replaces the number, e.g. the Signups picker. */
  children?: ReactNode;
};

/** Visitors, Page views, Avg. time and Signups (docs/SPEC.md section 11.2). */
export function StatCard({
  id,
  value,
  change,
  missing,
  versus,
  dimmed,
  actions,
  children,
}: StatCardProps) {
  const card = cardById[id];
  return (
    <CardShell id={id} title={card.title} help={card.help} dimmed={dimmed} actions={actions}>
      {children ?? (
        <StatValue value={value ?? "—"}>
          {value === null ? (
            // No value means no comparison either; keep the line's height so nothing moves.
            <span className="h-5" aria-hidden="true" />
          ) : (
            <Delta change={change} missing={missing} versus={versus} />
          )}
        </StatValue>
      )}
    </CardShell>
  );
}
