import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A handwritten note with a curved arrow ("Interactive demo ↙", "2 months free ↘").
 * Placed absolutely by the caller, so the late handwriting font moves nothing.
 * Decoration only: the same words are on the page for screen readers.
 */
export function HandNote({
  children,
  arrow,
  className,
}: {
  children: ReactNode;
  /** Where the arrow points: down and to the left, or down and to the right. */
  arrow: "down-left" | "down-right";
  className?: string;
}) {
  const left = arrow === "down-left";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex items-start gap-1 font-hand text-2xl leading-none whitespace-nowrap select-none",
        left ? "flex-row" : "flex-row-reverse",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("mt-2 h-6 w-9 shrink-0", !left && "-scale-x-100")}
      >
        <path d="M45 4C33 2.5 17 7 7.5 25" />
        <path d="M7.5 25 8.6 15.4M7.5 25l8.4-4.4" />
      </svg>
      <span className={left ? "" : "mr-0.5"}>{children}</span>
    </span>
  );
}
