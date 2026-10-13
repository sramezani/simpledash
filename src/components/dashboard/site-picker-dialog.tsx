"use client";

import { CheckIcon, LoaderCircleIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useId, useMemo, useState, useTransition } from "react";
import { GoogleButton } from "@/components/shared/google-button";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PropertyList, PropertySummary } from "@/lib/ga4/property-choice";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/text";
import { cn } from "@/lib/utils";

type SitePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "add": Growth adds a site to the list. "switch": Starter replaces its one site. */
  mode: "add" | "switch";
  listAction: () => Promise<PropertyList>;
  /** Adds or switches; on success it returns the site's ID and its dashboard opens. */
  pickAction: (propertyId: string) => Promise<{ error?: string; siteId?: string }>;
  /** Properties already in the list (add), or the one shown now (switch). */
  inList: string[];
  /** Add only: how many sites are in the list, and the plan's limit. */
  usage?: { used: number; limit: number };
  /** Starts Google sign-in again, when Google access ended. */
  reconnect?: () => Promise<void>;
};

/** A Google account's properties, grouped by the Analytics account they belong to. */
function byAccount(properties: PropertySummary[]) {
  const groups = new Map<string, PropertySummary[]>();
  for (const p of properties) {
    const list = groups.get(p.account) ?? [];
    list.push(p);
    groups.set(p.account, list);
  }
  return [...groups];
}

/**
 * "Add a site" (Growth) and "Switch site" (Starter): the Google Analytics properties
 * the user can read, fetched live when the dialog opens, grouped by account, with a
 * search box. Sites already in the list say so. Picking one opens its dashboard.
 */
export function SitePickerDialog({
  open,
  onOpenChange,
  mode,
  listAction,
  pickAction,
  inList,
  usage,
  reconnect,
}: SitePickerDialogProps) {
  const id = useId();
  const router = useRouter();
  const [list, setList] = useState<PropertyList | null>(null);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [pending, startPick] = useTransition();
  const full = mode === "add" && !!usage && usage.used >= usage.limit;

  function load() {
    startLoading(async () => setList(await listAction()));
  }

  useEffect(() => {
    if (open && !list && !loading) load();
    // Only when it opens: a failed load is retried with the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const properties = useMemo(() => (list && "properties" in list ? list.properties : []), [list]);
  const groups = useMemo(
    () =>
      byAccount(
        properties.filter((p) =>
          matchesSearch(deferred, p.displayName, p.account, p.propertyId.split("/")[1]),
        ),
      ),
    [properties, deferred],
  );

  function pick(propertyId: string) {
    setError(null);
    setPicking(propertyId);
    startPick(async () => {
      const result = await pickAction(propertyId);
      setPicking(null);
      if (result.siteId) {
        onOpenChange(false);
        setQuery("");
        router.push(`/dashboard?site=${result.siteId}` as Route);
      } else {
        setError(result.error ?? "That didn't work. Please try again.");
      }
    });
  }

  const title = mode === "add" ? "Add a site" : "Switch site";
  const description =
    mode === "add"
      ? "Your Google Analytics sites. Each one you add gets its own dashboard, notes, Monday email block and public page."
      : "Your Google Analytics sites. The one you pick replaces the site you see now; its notes and settings are kept for later.";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuery("");
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => {
          // On touch screens, don't open the keyboard straight away.
          if (window.matchMedia("(pointer: coarse)").matches) {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }
        }}
        className="flex h-[min(38rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-lg sm:max-w-lg"
      >
        <div className="flex flex-col gap-3 border-b px-4 pt-4 pb-3.5 sm:px-5">
          <div className="flex items-baseline gap-2 pr-8">
            <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
            {usage ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {usage.used} of {usage.limit} sites
              </span>
            ) : null}
          </div>
          <DialogDescription className="text-sm text-pretty text-muted-foreground">
            {description}
          </DialogDescription>
          <SearchInput
            id={`${id}-search`}
            label="Search your Google Analytics sites"
            placeholder="Search by name, account or ID…"
            value={query}
            onChange={setQuery}
          />
        </div>

        {full ? (
          <p role="status" className="border-b bg-muted/60 px-4 py-2.5 text-sm sm:px-5">
            You have {usage!.limit} sites, the most Growth allows. Remove one in Settings to add
            another.
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="border-b bg-destructive/5 px-4 py-2.5 text-sm text-destructive sm:px-5"
          >
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={loading}>
          {!list || loading ? (
            <ul className="flex flex-col gap-1 p-3" aria-label="Loading your sites">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/70" />
              ))}
            </ul>
          ) : "error" in list ? (
            <div className="flex flex-col items-start gap-3 px-5 py-8">
              <p className="text-sm">{list.error}</p>
              {list.reconnect && reconnect ? (
                <form action={reconnect}>
                  <GoogleButton>Reconnect Google</GoogleButton>
                </form>
              ) : (
                <Button type="button" variant="outline" className="h-9 gap-1.5" onClick={load}>
                  <RefreshCwIcon aria-hidden="true" />
                  Try again
                </Button>
              )}
            </div>
          ) : properties.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No Google Analytics sites in this Google account yet.
            </p>
          ) : groups.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            groups.map(([account, rows]) => (
              <section key={account} aria-label={account || "Other sites"} className="pb-1">
                <h3 className="sticky top-0 z-10 bg-popover/95 px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground backdrop-blur-xs sm:px-5">
                  {account || "Other sites"}
                </h3>
                <ul className="flex flex-col px-2 sm:px-3">
                  {rows.map((p) => {
                    const added = inList.includes(p.propertyId);
                    const busy = picking === p.propertyId;
                    return (
                      <li
                        key={p.propertyId}
                        className="flex min-h-14 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-100 hover:bg-muted/60"
                      >
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium" title={p.displayName}>
                            {p.displayName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground tabular-nums">
                            ID {p.propertyId.split("/")[1]}
                          </span>
                        </span>
                        {added ? (
                          <span className="inline-flex h-8 items-center gap-1 px-2 text-xs font-medium text-muted-foreground">
                            <CheckIcon className="size-3.5 text-primary" aria-hidden="true" />
                            {mode === "add" ? "Added" : "Showing"}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant={mode === "add" ? "outline" : "secondary"}
                            className={cn("h-8 gap-1.5 px-3", busy && "pointer-events-none")}
                            disabled={full || (pending && !busy)}
                            onClick={() => pick(p.propertyId)}
                            aria-label={`${mode === "add" ? "Add" : "Switch to"} ${p.displayName}`}
                          >
                            {busy ? (
                              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
                            ) : mode === "add" ? (
                              <PlusIcon aria-hidden="true" />
                            ) : null}
                            {mode === "add" ? "Add" : "Switch"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
        {list && "properties" in list && properties.length > 0 ? (
          <p
            className="border-t px-4 py-2.5 text-xs text-muted-foreground sm:px-5"
            aria-live="polite"
          >
            {formatNumber(properties.length)} {properties.length === 1 ? "site" : "sites"} in your
            Google account
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
