import { PencilIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PopoverButton } from "@/components/shared/popover-button";

/** The Signups card's "Change" button: opens the picker in a small panel. */
export function SignupChange({ picker }: { picker: ReactNode }) {
  return (
    <PopoverButton
      id="signup-change"
      label="Change the signup event"
      panel={picker}
      className="relative inline-flex size-7 items-center justify-center rounded-md text-muted-foreground after:absolute after:-inset-2 hover:bg-muted hover:text-foreground"
    >
      <PencilIcon className="size-3.5" aria-hidden="true" />
    </PopoverButton>
  );
}
