import { DownloadIcon } from "lucide-react";
import { PopoverButton } from "./popover-button";

/**
 * "Download CSV" for a card that holds several downloads (the overview): a small
 * menu of plain links, so it needs no JavaScript.
 */
export function CsvMenu({ id, items }: { id: string; items: { href: string; label: string }[] }) {
  return (
    <PopoverButton
      id={`${id}-csv`}
      label="Download as CSV"
      panelClassName="w-56 p-1.5"
      className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 after:absolute after:-inset-1.5 hover:bg-muted hover:text-foreground pointer-coarse:size-11"
      panel={
        <div className="flex flex-col">
          <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">
            Download as CSV
          </p>
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              download
              className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm transition-colors duration-100 hover:bg-muted pointer-coarse:h-11"
            >
              <DownloadIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </div>
      }
    >
      <DownloadIcon className="size-3.5" aria-hidden="true" />
    </PopoverButton>
  );
}
