"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "12m";

/**
 * The landing demo's date switch: the one tiny client island on the landing page.
 * All three views are rendered on the server; this only shows one at a time.
 */
export function DemoSwitch({ views }: { views: Record<Range, ReactNode> }) {
  const [range, setRange] = useState<Range>("7d");
  const labels: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "12m": "12 months" };
  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex self-start rounded-lg border bg-muted p-0.5"
      >
        {(Object.keys(labels) as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === range}
            onClick={() => setRange(r)}
            className={cn(
              "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-out pointer-coarse:h-11",
              r === range
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labels[r]}
          </button>
        ))}
      </div>
      {views[range]}
    </div>
  );
}
