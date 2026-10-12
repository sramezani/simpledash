import {
  ArrowDownIcon,
  ArrowDownRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  MinusIcon,
} from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type DeltaProps = {
  /** Whole-number % change, or null when there is no honest comparison. */
  change: number | null;
  /** Why there is no comparison, e.g. "Not enough history to compare". */
  missing?: string;
  /** For screen readers: "vs the previous 7 days". */
  versus: string;
  /** `compact`: "12% ↑" under a number in the overview, with the words for screen readers. */
  size?: "default" | "compact";
  className?: string;
};

/** A % change with an arrow and a word. Colour is never the only signal. */
export function Delta({
  change,
  missing = "Not enough history to compare",
  versus,
  size = "default",
  className,
}: DeltaProps) {
  const compact = size === "compact";
  if (change === null) {
    if (compact) {
      // No dash here: on a narrow card the words need the room.
      return <span className={cn("text-xs text-muted-foreground", className)}>{missing}</span>;
    }
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
  const words =
    direction === "same"
      ? "No change"
      : `${direction === "up" ? "Up" : "Down"} ${formatPercent(change)}`;
  const tone = cn(
    direction === "up" && "text-positive",
    direction === "down" && "text-negative",
    direction === "same" && "text-muted-foreground",
  );

  if (compact) {
    const Icon =
      direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : MinusIcon;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums",
          className,
        )}
      >
        <span aria-hidden="true">{formatPercent(Math.abs(change))}</span>
        <Icon className={cn("size-3.5 shrink-0", tone)} aria-hidden="true" />
        <span className="sr-only">
          {words} {versus}
        </span>
      </span>
    );
  }

  const Icon =
    direction === "up" ? ArrowUpRightIcon : direction === "down" ? ArrowDownRightIcon : MinusIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {words}
      <span className="sr-only"> {versus}</span>
    </span>
  );
}
