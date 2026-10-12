import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** What a card shows instead of a fake zero: plain words and, when useful, one action. */
export function EmptyState({ icon: Icon, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-1 flex-col items-start justify-center gap-2 py-2", className)}>
      {Icon ? <Icon className="size-5 text-muted-foreground" aria-hidden="true" /> : null}
      <p className="text-sm font-medium">{title}</p>
      {children ? (
        <div className="text-sm text-pretty text-muted-foreground">{children}</div>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
