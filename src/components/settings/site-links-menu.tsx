"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { chipButtonClass, SiteChip } from "@/components/shared/site-chip";
import { SiteIcon } from "@/components/shared/site-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SiteLink = { id: string; label: string; domain: string | null };

/**
 * Which site the site settings are for (docs/SPEC.md section 28.1): the site's chip,
 * and for several sites a menu of links to `/settings?site=<id>#site`.
 */
export function SiteLinksMenu({ current, sites }: { current: SiteLink; sites: SiteLink[] }) {
  if (sites.length <= 1) return <SiteChip domain={current.domain} label={current.label} />;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={cn(chipButtonClass, "group/site")}>
        <SiteIcon domain={current.domain} />
        <span className="truncate">
          <span className="sr-only">Settings for </span>
          {current.label}
        </span>
        <ChevronDownIcon
          className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]/site:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-64 p-1.5 duration-150">
        {sites.map((s) => (
          <DropdownMenuItem key={s.id} asChild className="h-10 cursor-pointer gap-2.5 rounded-md">
            <Link
              href={`/settings?site=${s.id}#site` as Route}
              aria-current={s.id === current.id ? "page" : undefined}
            >
              <SiteIcon domain={s.domain} />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {s.id === current.id ? (
                <CheckIcon className="size-4 text-primary" aria-label="Showing now" />
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
