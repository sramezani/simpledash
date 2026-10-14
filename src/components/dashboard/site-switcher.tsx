"use client";

import {
  ArrowLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  LockIcon,
  PlusIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRef, useState } from "react";
import { chipButtonClass } from "@/components/shared/site-chip";
import { SiteIcon } from "@/components/shared/site-icon";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PropertyList } from "@/lib/ga4/property-choice";
import { cn } from "@/lib/utils";
import { SitePickerDialog } from "./site-picker-dialog";
import { plans } from "@/config/plans";

export type SwitcherSite = {
  id: string;
  label: string;
  domain: string | null;
  /** False for a site the plan doesn't open now (added on Pro, now on Free). */
  openable: boolean;
  /** "Google access ended", "No access": shown next to the site. */
  problem: string | null;
};

type SiteSwitcherProps = {
  current: SwitcherSite;
  /** The user's list, in the order the sites were added. */
  sites: SwitcherSite[];
  /** Property IDs already in the list, so the picker can say "Added". */
  listedProperties: string[];
  /** The property shown now (Free's switcher marks it). */
  currentProperty: string;
  /** Pro: several sites, up to `limit`. */
  multiple: boolean;
  limit: number;
  /** The date range in the address, kept when moving between sites. */
  range: string | null;
  listAction: () => Promise<PropertyList>;
  switchAction: (propertyId: string) => Promise<{ error?: string; siteId?: string }>;
  addAction: (propertyId: string) => Promise<{ error?: string; siteId?: string }>;
  /** Starts Google sign-in again, when Google access ended. */
  reconnect?: () => Promise<void>;
};

/**
 * The site chip with the site menu (docs/SPEC.md section 28.1). Pro: the sites in
 * the list as links, "All sites" and "Add a site…". Free: its one site, "Switch
 * site…" and "Add another site" (the upgrade panel on /sites).
 */
export function SiteSwitcher({
  current,
  sites,
  listedProperties,
  currentProperty,
  multiple,
  limit,
  range,
  listAction,
  switchAction,
  addAction,
  reconnect,
}: SiteSwitcherProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  // Set while the menu closes to open the picker: it opens once the menu has finished
  // closing, so the menu's focus handling doesn't close it again.
  const toPicker = useRef(false);
  const href = (id: string) =>
    `/dashboard?site=${id}${range ? `&range=${encodeURIComponent(range)}` : ""}` as Route;
  const listed = sites.length;

  function openPicker() {
    toPicker.current = true;
    setMenuOpen(false);
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
        <DropdownMenuTrigger className={cn(chipButtonClass, "group/site", picker && "bg-muted/60")}>
          <SiteIcon domain={current.domain} />
          <span className="truncate">
            <span className="sr-only">Showing: </span>
            {current.label}
          </span>
          <ChevronDownIcon
            className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]/site:rotate-180"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-72 max-w-[calc(100vw-2rem)] p-1.5 duration-150"
          onCloseAutoFocus={(event) => {
            if (toPicker.current) {
              event.preventDefault();
              toPicker.current = false;
              setPicker(true);
            }
          }}
        >
          <DropdownMenuLabel className="flex items-baseline justify-between gap-2">
            <span>{multiple || listed > 1 ? "Your sites" : "Your site"}</span>
            {multiple ? (
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {listed} of {limit}
              </span>
            ) : null}
          </DropdownMenuLabel>
          <div className="max-h-[min(20rem,50dvh)] overflow-y-auto">
            {sites.map((s) => (
              <DropdownMenuItem
                key={s.id}
                asChild
                className="h-11 cursor-pointer gap-2.5 rounded-md"
              >
                <Link href={href(s.id)} aria-current={s.id === current.id ? "page" : undefined}>
                  <SiteIcon domain={s.domain} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{s.label}</span>
                    {s.problem ? (
                      <span className="truncate text-xs text-warning">{s.problem}</span>
                    ) : !s.openable ? (
                      <span className="truncate text-xs text-muted-foreground">
                        Paused · part of {plans.pro.name}
                      </span>
                    ) : null}
                  </span>
                  {s.id === current.id ? (
                    <CheckIcon className="size-4 text-primary" aria-label="Showing now" />
                  ) : !s.openable ? (
                    <LockIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  ) : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          {multiple ? (
            <>
              <DropdownMenuItem
                asChild
                className="h-9 cursor-pointer gap-2.5 rounded-md pointer-coarse:h-11"
              >
                <Link href={"/sites" as Route}>
                  <LayoutGridIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  All sites
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-9 cursor-pointer gap-2.5 rounded-md pointer-coarse:h-11"
                onSelect={(event) => {
                  event.preventDefault();
                  openPicker();
                }}
              >
                <PlusIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                Add a site…
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                className="h-9 cursor-pointer gap-2.5 rounded-md pointer-coarse:h-11"
                onSelect={(event) => {
                  event.preventDefault();
                  openPicker();
                }}
              >
                <ArrowLeftRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                Switch site…
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="h-9 cursor-pointer gap-2.5 rounded-md pointer-coarse:h-11"
              >
                <Link href={"/sites" as Route}>
                  <PlusIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">Add another site</span>
                  <Badge variant="secondary">{plans.pro.name}</Badge>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <SitePickerDialog
        open={picker}
        onOpenChange={setPicker}
        mode={multiple ? "add" : "switch"}
        listAction={listAction}
        pickAction={multiple ? addAction : switchAction}
        inList={multiple ? listedProperties : [currentProperty]}
        usage={multiple ? { used: listed, limit } : undefined}
        reconnect={reconnect}
      />
    </div>
  );
}
