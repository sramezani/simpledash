import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RollingPrice, Swap, YearlyOnly } from "./rolling-price";

type PlanCardProps = {
  name: string;
  badge?: ReactNode;
  summary: string;
  prices: { month: number; year: number };
  /** What paying yearly saves, in euros (12 × the monthly price − the yearly price). */
  yearlySaving: number;
  features: readonly string[];
  /** The plan to pick: a coloured edge and a raised card. */
  highlight?: boolean;
  /** `compact`: inside the app (upgrade panels, settings), smaller than the pricing section. */
  size?: "default" | "compact";
  footer?: ReactNode;
  className?: string;
};

/**
 * A plan with its price, feature list and action (docs/SPEC.md sections 17 and 28.1).
 * Prices follow the Monthly / Yearly switch around it (`group/billing`), with CSS only.
 */
export function PlanCard({
  name,
  badge,
  summary,
  prices,
  yearlySaving,
  features,
  highlight = false,
  size = "default",
  footer,
  className,
}: PlanCardProps) {
  const compact = size === "compact";
  return (
    <article
      className={cn(
        "flex flex-col border bg-background",
        compact ? "gap-4 rounded-2xl p-5" : "gap-6 rounded-3xl p-7 sm:p-8",
        highlight ? "border-primary/60 shadow-lg ring-1 ring-primary/60" : "shadow-xs",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {name}
          </h3>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <div className="flex flex-col">
        <p className="flex items-baseline gap-1.5">
          <RollingPrice
            month={formatPrice(prices.month)}
            year={formatPrice(prices.year)}
            className={cn("font-semibold tracking-tight", compact ? "text-3xl" : "text-5xl")}
          />
          <Swap
            month="/ month"
            year="/ year"
            className={cn("text-muted-foreground", compact ? "text-sm" : "text-base")}
          />
        </p>
        <YearlyOnly>
          <p
            className={cn(
              "flex items-center gap-2 text-sm font-medium text-primary",
              compact ? "pt-2" : "pt-3",
            )}
          >
            <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
            Save {formatPrice(yearlySaving)} a year
          </p>
        </YearlyOnly>
      </div>
      <ul
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-2 text-sm" : "gap-3 text-sm sm:text-base",
        )}
      >
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <CheckIcon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                highlight ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            {f}
          </li>
        ))}
      </ul>
      {footer}
    </article>
  );
}
