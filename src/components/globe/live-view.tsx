"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { LiveData } from "@/lib/ga4/live";
import { GlobeCanvas } from "./globe-canvas";

type LiveViewProps = {
  /** Server-rendered data, or null to fetch it straight away (the cached public page). */
  initial: LiveData | null;
  /** Where to poll for fresh data (/api/live), or null for a still demo. */
  endpoint: string | null;
};

/**
 * "Right now": the count, places and live pages, with the globe beside them.
 * Rendered on the server first as plain lists; polls about every 45 seconds while
 * the tab is visible, and stops when it's hidden (docs/SPEC.md section 11.10).
 */
export function LiveView({ initial, endpoint }: LiveViewProps) {
  const [data, setData] = useState<LiveData | null>(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!endpoint) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const poll = async () => {
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch(endpoint, { cache: "no-store" });
          if (response.ok) setData((await response.json()) as LiveData);
          else setFailed(true);
        } catch {
          // Keep the last numbers; try again next time.
          setFailed(true);
        }
      }
      if (!stopped) timer = setTimeout(poll, 40_000 + Math.random() * 10_000);
    };
    timer = setTimeout(poll, initial ? 40_000 + Math.random() * 10_000 : 0);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endpoint, initial]);

  if (!data) {
    // Laid out like the loaded card (the globe sets its height), so nothing jumps.
    return failed ? (
      <p className="text-sm text-muted-foreground">Live numbers aren&apos;t available right now.</p>
    ) : (
      <LiveSkeleton />
    );
  }

  return (
    <div className="grid items-center gap-4 @2xl:grid-cols-[1fr_16rem]">
      <div className="flex flex-col gap-4">
        <p className="text-3xl font-semibold tracking-tight tabular-nums" aria-live="polite">
          {formatNumber(data.total)}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            {data.total === 1 ? "visitor" : "visitors"} in the last {data.minutes} minutes
          </span>
        </p>
        {data.total === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody on the site right now.</p>
        ) : (
          <div className="grid gap-4 @lg:grid-cols-2">
            <LiveList
              title="Where they are"
              rows={data.places
                .slice(0, 5)
                .map((p) => ({ key: p.label, label: p.label, value: p.visitors }))}
            />
            <LiveList
              title="Pages they're on"
              rows={data.pages.map((p) => ({ key: p.title, label: p.title, value: p.visitors }))}
            />
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <GlobeCanvas places={data.places} />
      </div>
    </div>
  );
}

function LiveList({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; value: number }[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h3 className="text-xs text-muted-foreground">{title}</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate" title={row.label}>
              {row.label}
            </span>
            <span className="tabular-nums">{formatNumber(row.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The loading state, in the loaded card's layout: the globe's square sets the height. */
export function LiveSkeleton() {
  return (
    <div className="grid items-center gap-4 @2xl:grid-cols-[1fr_16rem]" aria-busy="true">
      <span className="sr-only">Loading live visitors…</span>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="aspect-square w-full max-w-64 rounded-full" />
      </div>
    </div>
  );
}
