import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { LogoMark } from "@/components/shared/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The settings frame (docs/SPEC.md section 5): a slim top bar back to the dashboard,
 * the settings menu on the left (a sideways row on phones) and the page beside it.
 */
export function SettingsShell({
  nav,
  dashboardHref = "/dashboard",
  children,
}: {
  nav: ReactNode;
  dashboardHref?: "/dashboard" | "/ui-kit/dashboard";
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-b bg-background">
        <Container className="flex h-14 items-center gap-2">
          <Link href={dashboardHref} aria-label="SimpleDash dashboard" className="rounded-md">
            <LogoMark className="size-7 text-brand" />
          </Link>
          <Link
            href={dashboardHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground pointer-coarse:h-11"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
        </Container>
      </header>
      <main id="main" className="pb-20">
        <Container className="grid gap-6 pt-6 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 md:pt-10 lg:gap-14">
          <aside className="min-w-0 md:sticky md:top-8 md:self-start">
            <p className="hidden px-2.5 pb-5 text-lg font-semibold tracking-tight md:block">
              Settings
            </p>
            {nav}
          </aside>
          <div className="flex max-w-2xl min-w-0 flex-col gap-6">{children}</div>
        </Container>
      </main>
    </>
  );
}

/** A settings page's heading, with an optional line under it and something on the right. */
export function SettingsHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: ReactNode;
  /** Before the title, e.g. a site's icon. */
  icon?: ReactNode;
  /** On the right, e.g. "Open dashboard". */
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="flex min-w-0 items-center gap-2.5 text-2xl font-semibold tracking-tight">
          {icon}
          <span className="truncate">{title}</span>
        </h1>
        {description ? (
          <p className="text-sm text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

/** A card of settings with its heading. `id` lets links jump to it (/settings/sites/…#search). */
export function SettingsSection({
  id,
  title,
  description,
  danger,
  children,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : title}
      className={cn(
        "flex scroll-mt-20 flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs sm:p-6",
        danger && "border-destructive/30",
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className={cn("text-base font-semibold", danger && "text-destructive")}>
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A settings page while it loads: its heading and two cards. */
export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Loading settings…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  );
}
