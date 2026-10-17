import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/shared/logo";
import { plans } from "@/config/plans";

/**
 * The one product block of a guide (docs/CONTENT-PLAN.md section 4.4, rule 6): what the same
 * thing looks like in SimpleDash, then "Start free" (or "Open dashboard" when this browser is
 * signed in, by the `signed-in:` variant) and the live demo.
 */
export function InSimpleDash({
  title = "See it in SimpleDash",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="not-prose my-8 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2.5">
        <LogoMark className="size-6 text-brand" />
        <p className="text-base font-semibold">{title}</p>
      </div>
      <div className="mt-2 flex flex-col gap-2 text-sm text-pretty text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline">
        {children}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 pointer-coarse:h-11"
        >
          <span className="signed-in:hidden">Start free with Google Analytics</span>
          <span className="hidden signed-in:inline">Open my dashboard</span>
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/demo"
          className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          See the live demo
        </Link>
        <span className="text-xs text-muted-foreground signed-in:hidden">
          {plans.free.name}, no card, read-only access
        </span>
      </div>
    </aside>
  );
}
