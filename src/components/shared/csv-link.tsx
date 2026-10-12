import { DownloadIcon } from "lucide-react";

/** "Download CSV" in a card's header: a plain link, so it needs no JavaScript. */
export function CsvLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="relative inline-flex size-7 items-center justify-center rounded-md text-muted-foreground after:absolute after:-inset-2 hover:bg-muted hover:text-foreground"
    >
      <DownloadIcon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">Download {label} as CSV</span>
    </a>
  );
}
