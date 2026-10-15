"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { GoogleButton } from "@/components/shared/google-button";
import { SearchInput } from "@/components/shared/search-input";
import { chipButtonClass } from "@/components/shared/site-chip";
import { SiteIcon } from "@/components/shared/site-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PropertyList } from "@/lib/ga4/property-choice";
import { filterSiteMenu, siteMenuGroups, type MenuSite, type SiteMenuRow } from "@/lib/sites/menu";
import { cn } from "@/lib/utils";

export type SwitcherSite = MenuSite;

type SiteSwitcherProps = {
  current: SwitcherSite;
  /** The user's sites, in the order they were added (the current one included). */
  sites: SwitcherSite[];
  /** The date range in the address, kept when moving between sites. */
  range: string | null;
  /** Every Google Analytics site the Google account can read, fetched live. */
  listAction: () => Promise<PropertyList>;
  /** Opens a site that isn't one of the user's sites yet: it joins their list. */
  openAction: (propertyId: string) => Promise<{ siteId?: string; error?: string }>;
  /** Starts Google sign-in again, when Google access ended. */
  reconnect?: () => Promise<void>;
  /** Where the dashboard and a site's settings live (the dev preview passes its own). */
  dashboardPath?: string;
  /** A site's settings address, with the site's ID appended. */
  settingsPath?: string;
};

/** Google's list is kept for a few minutes, so reopening the menu is instant. */
const LIST_TTL = 5 * 60_000;
let listCache: { list: PropertyList; at: number } | null = null;
/** A search box shows once the list is long enough to need one. */
const SEARCH_FROM = 8;
const ITEM = '[role="menuitem"]';

/**
 * The site chip and its menu (docs/SPEC.md section 28.1), the same on every plan: every
 * Google Analytics site in the user's Google account, grouped by account. One click opens
 * a site (there is no site limit); the gear next to each of the user's sites opens its
 * settings.
 */
export function SiteSwitcher({
  current,
  sites,
  range,
  listAction,
  openAction,
  reconnect,
  dashboardPath = "/dashboard",
  settingsPath = "/settings/sites/",
}: SiteSwitcherProps) {
  const id = useId();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [list, setList] = useState<PropertyList | null>(() =>
    listCache && Date.now() - listCache.at < LIST_TTL ? listCache.list : null,
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [, startOpening] = useTransition();
  const content = useRef<HTMLDivElement>(null);
  /** Where keyboard focus was when Google's list arrived: the row, and the site or its gear. */
  const focused = useRef<{ row: string; item: number } | null>(null);

  const dashboardHref = (siteId: string) =>
    `${dashboardPath}?site=${siteId}${range ? `&range=${encodeURIComponent(range)}` : ""}` as Route;
  const settingsHref = (siteId: string) => `${settingsPath}${siteId}` as Route;

  function load(force = false) {
    if (loading || (!force && list && "properties" in list)) return;
    startLoading(async () => {
      const next = await listAction();
      if ("properties" in next) listCache = { list: next, at: Date.now() };
      const active = document.activeElement;
      const row = active?.closest<HTMLElement>("[data-property]");
      focused.current = content.current?.contains(active)
        ? {
            row: row?.dataset.property ?? "",
            item: row ? [...row.querySelectorAll(ITEM)].indexOf(active!) : 0,
          }
        : null;
      setList(next);
    });
  }

  // The rows are rebuilt from Google's list, which drops keyboard focus out of the menu:
  // put it back on the same site (or its gear), so the arrow keys keep working.
  useLayoutEffect(() => {
    const menu = content.current;
    const was = focused.current;
    focused.current = null;
    if (!menu || !was || menu.contains(document.activeElement)) return;
    const items = menu.querySelectorAll<HTMLElement>(
      `[data-property="${CSS.escape(was.row)}"] ${ITEM}`,
    );
    (items[was.item] ?? items[0] ?? menu.querySelector<HTMLElement>(ITEM))?.focus();
  }, [list]);

  // The list loads the first time the menu opens (or is about to: see the trigger).
  useEffect(() => {
    if (menuOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  const properties = list && "properties" in list ? list.properties : null;
  const groups = useMemo(
    () => filterSiteMenu(siteMenuGroups(properties, sites, current.id), query),
    [properties, sites, current.id, query],
  );
  const showSearch = (properties?.length ?? 0) >= SEARCH_FROM;
  const showAccounts = groups.filter((g) => g.account).length > 1;

  function open(row: SiteMenuRow) {
    setError(null);
    setOpening(row.propertyId);
    startOpening(async () => {
      const result = await openAction(row.propertyId);
      setOpening(null);
      if (result.siteId) {
        setMenuOpen(false);
        setQuery("");
        router.push(dashboardHref(result.siteId));
      } else {
        setError(result.error ?? "That didn't work. Please try again.");
      }
    });
  }

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(next) => {
        setMenuOpen(next);
        if (!next) {
          setQuery("");
          setError(null);
        }
      }}
      modal={false}
    >
      <DropdownMenuTrigger
        className={cn(chipButtonClass, "group/site")}
        // Start loading on hover, so the list is usually there when the menu opens.
        onPointerEnter={() => load()}
      >
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
        ref={content}
        align="start"
        sideOffset={6}
        className="flex w-80 max-w-[calc(100vw-2rem)] flex-col p-1.5 duration-150"
      >
        <DropdownMenuLabel className="pb-1.5">Google Analytics sites</DropdownMenuLabel>

        {showSearch ? (
          <div
            className="px-1 pb-1.5"
            // The menu's own keys (type to jump, arrows) stay out of the search box.
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                content.current?.querySelector<HTMLElement>(ITEM)?.focus();
              } else if (event.key !== "Escape") {
                event.stopPropagation();
              }
            }}
          >
            <SearchInput
              id={`${id}-search`}
              label="Search your Google Analytics sites"
              placeholder="Search sites…"
              value={query}
              onChange={setQuery}
            />
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mx-1 mb-1.5 rounded-md bg-destructive/5 px-2.5 py-2 text-xs text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div
          className="max-h-[min(22rem,55dvh)] overflow-y-auto overscroll-contain"
          aria-busy={loading}
        >
          {groups.map((group, i) => (
            <div
              key={group.account || `group-${i}`}
              role="group"
              aria-label={group.account || "Your sites"}
            >
              {showAccounts && group.account ? (
                <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                  {group.account}
                </p>
              ) : null}
              {group.rows.map((row) => (
                <SiteRow
                  key={row.propertyId}
                  row={row}
                  busy={opening === row.propertyId}
                  disabled={opening !== null && opening !== row.propertyId}
                  dashboardHref={row.siteId ? dashboardHref(row.siteId) : null}
                  settingsHref={row.siteId ? settingsHref(row.siteId) : null}
                  onOpen={() => open(row)}
                />
              ))}
            </div>
          ))}

          {list === null || loading ? (
            <div
              className="flex flex-col gap-1 p-1"
              aria-label="Loading your Google Analytics sites"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-muted/70" />
              ))}
            </div>
          ) : "error" in list ? (
            <div className="flex flex-col items-start gap-2 px-2 py-3">
              <p className="text-sm">{list.error}</p>
              {list.reconnect && reconnect ? (
                <form action={reconnect}>
                  <GoogleButton>Reconnect Google</GoogleButton>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={() => load(true)}
                >
                  <RefreshCwIcon aria-hidden="true" />
                  Try again
                </Button>
              )}
            </div>
          ) : properties?.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No Google Analytics sites in this Google account yet.
            </p>
          ) : groups.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * One site in the menu: the site itself (a link to its dashboard when it's one of the
 * user's sites, otherwise it's opened through the server), and for the user's own
 * sites a gear to their settings.
 */
function SiteRow({
  row,
  busy,
  disabled,
  dashboardHref,
  settingsHref,
  onOpen,
}: {
  row: SiteMenuRow;
  busy: boolean;
  disabled: boolean;
  dashboardHref: Route | null;
  settingsHref: Route | null;
  onOpen: () => void;
}) {
  const body = (
    <>
      <SiteIcon domain={row.domain} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate" title={row.label}>
          {row.label}
        </span>
        {row.problem ? <span className="truncate text-xs text-warning">{row.problem}</span> : null}
      </span>
      {busy ? (
        <LoaderCircleIcon
          className="size-4 animate-spin text-muted-foreground"
          aria-label="Opening"
        />
      ) : row.current ? (
        <CheckIcon className="size-4 text-primary" aria-label="Showing now" />
      ) : null}
    </>
  );
  const itemClass = "min-h-9 flex-1 gap-2.5 rounded-md py-1.5 pointer-coarse:min-h-11";
  return (
    <div className="flex items-center gap-0.5" data-property={row.propertyId}>
      {dashboardHref ? (
        <DropdownMenuItem asChild className={itemClass} disabled={disabled}>
          <Link href={dashboardHref} aria-current={row.current ? "page" : undefined}>
            {body}
          </Link>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          className={itemClass}
          disabled={disabled}
          onSelect={(event) => {
            // Stay open: the row shows a spinner until the site opens.
            event.preventDefault();
            if (!busy) onOpen();
          }}
        >
          {body}
        </DropdownMenuItem>
      )}
      {settingsHref ? (
        <DropdownMenuItem
          asChild
          className="size-9 shrink-0 justify-center rounded-md p-0 text-muted-foreground pointer-coarse:size-11"
        >
          <Link href={settingsHref} aria-label={`Settings for ${row.label}`} title="Settings">
            <SettingsIcon className="size-4" aria-hidden="true" />
          </Link>
        </DropdownMenuItem>
      ) : null}
    </div>
  );
}
