import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type DeltaProps = {
  /** Whole-number % change, or null when there is no honest comparison. */
  change: number | null;
  /** Why there is no comparison, e.g. "Not enough history to compare". */
  missing?: string;
  /** For screen readers: "vs the previous 7 days". */
  versus: string;
  className?: string;
};

/** A % change with an arrow and a word. Colour is never the only signal. */
export function Delta({
  change,
  missing = "Not enough history to compare",
  versus,
  className,
}: DeltaProps) {
  if (change === null) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-sm text-muted-foreground", className)}
      >
        <MinusIcon className="size-3.5 shrink-0" aria-hidden="true" />
        {missing}
      </span>
    );
  }
  const direction = change > 0 ? "up" : change < 0 ? "down" : "same";
  const Icon =
    direction === "up" ? ArrowUpRightIcon : direction === "down" ? ArrowDownRightIcon : MinusIcon;
  const words =
    direction === "same"
      ? "No change"
      : `${direction === "up" ? "Up" : "Down"} ${formatPercent(change)}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
        direction === "up" && "text-positive",
        direction === "down" && "text-negative",
        direction === "same" && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {words}
      <span className="sr-only"> {versus}</span>
    </span>
  );
}
