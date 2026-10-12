import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteIcon } from "./site-icon";

/**
 * The look of the toolbar buttons above the overview (site, date range): a raised
 * white chip. Shared with the client parts (SiteSwitcher, RangePicker).
 */
export const chipClass =
  "inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium shadow-xs transition-[color,background-color,box-shadow] duration-150 ease-out pointer-coarse:h-11";

/** Clickable chips also get a hover and an open state. */
export const chipButtonClass = cn(
  chipClass,
  "cursor-pointer hover:bg-muted/60 data-[state=open]:bg-muted/60 data-[state=open]:shadow-none",
);

/** The site a page shows: its icon and address. `as="h1"` on public pages. */
export function SiteChip({
  domain,
  label,
  as: Tag = "div",
  children,
}: {
  domain: string | null;
  label: string;
  as?: "div" | "h1";
  /** After the label, e.g. a "Sample data" badge. */
  children?: ReactNode;
}) {
  return (
    <Tag className={chipClass}>
      <SiteIcon domain={domain} />
      <span className="truncate">{label}</span>
      {children}
    </Tag>
  );
}
