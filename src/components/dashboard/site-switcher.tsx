"use client";

import { CheckIcon, ChevronDownIcon, LoaderCircleIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { chipButtonClass } from "@/components/shared/site-chip";
import { SiteIcon } from "@/components/shared/site-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PropertyList } from "@/lib/ga4/property-choice";

type SiteSwitcherProps = {
  label: string;
  /** The site's address, for its icon. */
  domain: string | null;
  currentPropertyId: string | null;
  listAction: () => Promise<PropertyList>;
  switchAction: (propertyId: string) => Promise<{ error?: string }>;
};

/** The site chip with a menu of the user's sites. Opening it fetches them live (docs/SPEC.md section 7). */
export function SiteSwitcher({
  label,
  domain,
  currentPropertyId,
  listAction,
  switchAction,
}: SiteSwitcherProps) {
  const [list, setList] = useState<PropertyList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(open: boolean) {
    if (open && !list) startTransition(async () => setList(await listAction()));
  }

  function choose(propertyId: string) {
    if (propertyId === currentPropertyId) return;
    startTransition(async () => {
      const result = await switchAction(propertyId);
      setMessage(result.error ?? null);
    });
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger className={`${chipButtonClass} group/site`}>
          <SiteIcon domain={domain} />
          <span className="truncate">
            <span className="sr-only">Showing: </span>
            {label}
          </span>
          {pending ? (
            <LoaderCircleIcon
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <ChevronDownIcon
              className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]/site:rotate-180"
              aria-hidden="true"
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-72 max-w-[calc(100vw-2rem)] p-1.5 duration-150"
        >
          <DropdownMenuLabel>Your Google Analytics sites</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!list ? (
            <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
          ) : "error" in list ? (
            <DropdownMenuItem disabled>{list.error}</DropdownMenuItem>
          ) : list.properties.length === 0 ? (
            <DropdownMenuItem disabled>No Google Analytics sites found</DropdownMenuItem>
          ) : (
            list.properties.map((p) => (
              <DropdownMenuItem
                key={p.propertyId}
                onSelect={() => choose(p.propertyId)}
                className="gap-2"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{p.displayName}</span>
                  {p.account ? (
                    <span className="truncate text-xs text-muted-foreground">{p.account}</span>
                  ) : null}
                </span>
                {p.propertyId === currentPropertyId ? (
                  <CheckIcon className="size-4 text-primary" aria-label="Showing now" />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {message ? (
        <span role="alert" className="text-xs text-destructive">
          {message}
        </span>
      ) : null}
    </div>
  );
}
