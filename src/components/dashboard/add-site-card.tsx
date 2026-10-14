"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import type { PropertyList } from "@/lib/ga4/property-choice";
import { SitePickerDialog } from "./site-picker-dialog";

/** The dashed "Add a site" card at the end of All sites (Pro, below the limit). */
export function AddSiteCard({
  listAction,
  addAction,
  listedProperties,
  used,
  limit,
  reconnect,
}: {
  listAction: () => Promise<PropertyList>;
  addAction: (propertyId: string) => Promise<{ error?: string; siteId?: string }>;
  listedProperties: string[];
  used: number;
  limit: number;
  reconnect?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:border-primary/50 hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted">
          <PlusIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="font-medium">Add a site</span>
        <span className="text-xs tabular-nums">
          {used} of {limit} sites
        </span>
      </button>
      <SitePickerDialog
        open={open}
        onOpenChange={setOpen}
        mode="add"
        listAction={listAction}
        pickAction={addAction}
        inList={listedProperties}
        usage={{ used, limit }}
        reconnect={reconnect}
      />
    </>
  );
}
