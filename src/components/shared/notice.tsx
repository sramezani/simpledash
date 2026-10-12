import { AlertTriangleIcon, InfoIcon, OctagonAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "danger";

const tones: Record<Tone, { box: string; icon: string; Icon: typeof InfoIcon }> = {
  info: { box: "border-border bg-card", icon: "text-primary", Icon: InfoIcon },
  warning: { box: "border-warning/40 bg-warning/5", icon: "text-warning", Icon: AlertTriangleIcon },
  danger: {
    box: "border-destructive/40 bg-destructive/5",
    icon: "text-destructive",
    Icon: OctagonAlertIcon,
  },
};

type NoticeProps = {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  /** One action: a button or link. */
  action?: ReactNode;
  className?: string;
};

/** A banner for dashboard states and notices: plain copy and one action (docs/SPEC.md section 12). */
export function Notice({ tone = "info", title, children, action, className }: NoticeProps) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center",
        box,
        className,
      )}
    >
      <div className="flex flex-1 gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", icon)} aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{title}</p>
          {children ? <div className="text-sm text-muted-foreground">{children}</div> : null}
        </div>
      </div>
      {action ? <div className="shrink-0 sm:ml-auto">{action}</div> : null}
    </div>
  );
}
