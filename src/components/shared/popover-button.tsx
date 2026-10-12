import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PopoverButtonProps = {
  /** Unique on the page. */
  id: string;
  /** The button's content, e.g. an icon or a word. */
  children: ReactNode;
  /** Accessible name when the button shows only an icon. */
  label?: string;
  /** What opens. */
  panel: ReactNode;
  className?: string;
  panelClassName?: string;
};

/**
 * A button that opens a small panel. A native popover: no JavaScript, Escape and
 * outside clicks close it, and it sits under the button where CSS anchor
 * positioning exists (centred elsewhere).
 */
export function PopoverButton({
  id,
  children,
  label,
  panel,
  className,
  panelClassName,
}: PopoverButtonProps) {
  const popoverId = `${id}-popover`;
  const anchor = `--${popoverId}`;
  return (
    <>
      <button
        type="button"
        popoverTarget={popoverId}
        aria-label={label}
        className={className}
        style={{ anchorName: anchor } as CSSProperties}
      >
        {children}
      </button>
      <div
        id={popoverId}
        popover="auto"
        className={cn(
          "anchored-popover max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border bg-popover p-3 text-sm text-pretty text-popover-foreground shadow-md",
          panelClassName,
        )}
        style={{ positionAnchor: anchor } as CSSProperties}
      >
        {panel}
      </div>
    </>
  );
}
