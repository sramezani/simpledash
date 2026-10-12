import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HelpTip } from "./help-tip";

type CardShellProps = {
  id: string;
  title: string;
  help?: string;
  /** Right side of the header: a toggle, a badge, "Download CSV". */
  actions?: ReactNode;
  /** A one-line note under the header, e.g. the quota note. */
  note?: ReactNode;
  /** Greyed out, for cached numbers that can't be refreshed (Google access ended). */
  dimmed?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Every card sits in this shell, so title, help, actions and the loading, empty,
 * error, stale and locked states look the same everywhere (docs/SPEC.md section 11).
 * It is a size container, so the content adapts to the card's width, not the page's.
 */
export function CardShell({
  id,
  title,
  help,
  actions,
  note,
  dimmed,
  className,
  children,
}: CardShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "@container flex min-w-0 flex-col rounded-xl border bg-card text-card-foreground",
        className,
      )}
    >
      <header className="flex min-h-11 items-center justify-between gap-2 px-4 pt-3">
        <div className="flex min-w-0 items-center gap-1">
          <h2
            id={`${id}-title`}
            className="text-sm leading-tight font-medium text-muted-foreground"
          >
            {title}
          </h2>
          {help ? (
            <HelpTip id={id} label={title}>
              {help}
            </HelpTip>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </header>
      {note ? <div className="px-4 pt-1 text-xs text-warning">{note}</div> : null}
      <div className={cn("flex flex-1 flex-col px-4 pt-2 pb-4", dimmed && "opacity-55 grayscale")}>
        {children}
      </div>
    </section>
  );
}
