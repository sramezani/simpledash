import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PopoverButton } from "./popover-button";

/** The ⓘ help next to a card title: plain words about what the card counts. */
export function HelpTip({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <PopoverButton
      id={`${id}-help`}
      label={`About ${label}`}
      panel={children}
      panelClassName="max-w-72"
      className="relative inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out after:absolute after:-inset-2.5 hover:text-foreground"
    >
      <InfoIcon className="size-3.5" aria-hidden="true" />
    </PopoverButton>
  );
}
