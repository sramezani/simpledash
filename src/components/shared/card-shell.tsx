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
  /** Title for screen readers only; the ⓘ and actions stay (the content names the card). */
  hideTitle?: boolean;
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
  hideTitle,
  className,
  children,
}: CardShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "@container relative flex min-w-0 flex-col rounded-2xl border bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      <header
        className={cn(
          "flex min-h-11 items-center justify-between gap-2 px-4 pt-3",
          hideTitle && "absolute top-0 right-0 z-10",
        )}
      >
        <div className="flex min-w-0 items-center gap-1">
          <h2
            id={`${id}-title`}
            className={cn(
              "text-sm leading-tight font-medium text-muted-foreground",
              hideTitle && "sr-only",
            )}
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
      <div
        className={cn(
          "flex flex-1 flex-col px-4 pb-4",
          hideTitle ? "pt-4" : "pt-2",
          dimmed && "opacity-55 grayscale",
        )}
      >
        {children}
      </div>
    </section>
  );
}
