import { ArrowUpRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Sparkline } from "@/components/charts/sparkline";
import { Delta } from "@/components/shared/delta";
import { SiteIcon } from "@/components/shared/site-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SiteCardData = {
  id: string;
  label: string;
  domain: string | null;
  /** Visitors in the last 7 days, or null when there are no numbers yet. */
  visitors: number | null;
  change: number | null;
  /** Why there's no comparison ("Not enough history to compare"), or null. */
  missing: string | null;
  /** Visitors per day, for the line. */
  series: number[];
  /** "Google access ended": the numbers are the last ones we had. */
  problem: string | null;
  /** The site the dashboard opens with now. */
  current: boolean;
};

const shell =
  "@container relative flex min-h-44 flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] duration-150 ease-out";

/**
 * One site on All sites (docs/SPEC.md section 28.1): its icon and address, visitors
 * for the last 7 days with the change, and a small line. The whole card opens the
 * site's dashboard.
 */
export function SiteCard({ site }: { site: SiteCardData }) {
  const href = `/dashboard?site=${site.id}` as Route;
  return (
    <article className={cn(shell, "group/card hover:border-primary/40 hover:shadow-sm")}>
      <div className="flex items-center gap-2">
        <SiteIcon domain={site.domain} />
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
          {/* The link covers the card, so the whole card is one target. */}
          <Link
            href={href}
            className="rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {site.label}
          </Link>
        </h2>
        {site.current ? <span className="text-xs text-muted-foreground">Last opened</span> : null}
        <ArrowUpRightIcon
          className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-foreground"
          aria-hidden="true"
        />
      </div>
      <div className={cn("flex flex-col gap-1", site.problem && "opacity-60")}>
        <p className="text-xs text-muted-foreground">Visitors · last 7 days</p>
        {site.visitors === null ? (
          <p className="text-sm text-muted-foreground">No numbers yet</p>
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatNumber(site.visitors)}
            </p>
            <Delta
              change={site.change}
              missing={site.missing ?? undefined}
              versus="vs the previous 7 days"
              size="compact"
            />
          </div>
        )}
      </div>
      <Sparkline values={site.series} pendingLast className="mt-auto" />
      {site.problem ? <p className="text-xs text-warning">{site.problem}</p> : null}
    </article>
  );
}

/** The card's shape while its numbers load, so nothing moves. */
export function SiteCardSkeleton({ label, domain }: { label: string; domain: string | null }) {
  return (
    <div className={shell} aria-busy="true">
      <div className="flex items-center gap-2">
        <SiteIcon domain={domain} />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{label}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="mt-auto h-12 w-full" />
    </div>
  );
}
