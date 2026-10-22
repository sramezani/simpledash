"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { LiveCount, LiveData } from "@/lib/ga4/live";
import { cn } from "@/lib/utils";
import { useLivePoll } from "./use-live-poll";

const loadDialog = () => import("./live-dialog");
const LiveDialog = dynamic(loadDialog, { ssr: false });

type LiveButtonProps = {
  /** Where to poll for the count (/api/live?site=… or /api/p/<slug>/live), or null for a still sample. */
  endpoint: string | null;
  /** The count rendered on the server, or null to ask straight away (the cached public page). */
  initial?: LiveCount | null;
  /** A fixed live view (the dev preview and samples): no polling at all. */
  sample?: LiveData;
  siteName: string;
  signupEvent: string | null;
};

/**
 * "● 3 live" beside the date menu (docs/SPEC.md section 11.10): one small request every
 * 20 seconds. A click opens the live view, whose code (and the globe's) loads only then,
 * fetched early when the pointer or focus reaches the button.
 */
export function LiveButton({
  endpoint,
  initial = null,
  sample,
  siteName,
  signupEvent,
}: LiveButtonProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  // The newest count, from this button's polls or from the open view's.
  const [latest, setLatest] = useState<LiveCount | null>(initial);
  // While the view is open it polls everything, count included, so this one rests.
  const polled = useLivePoll<LiveCount>(sample || open ? null : endpoint, initial, setLatest);
  const count = sample ?? latest;
  const failed = !sample && !count && polled.failed;
  const loading = !sample && !count && !failed;
  const total = count?.total ?? 0;
  const minutes = count?.minutes ?? 30;

  const label = count
    ? `${total} ${total === 1 ? "visitor" : "visitors"} in the last ${minutes} minutes. Open the live view.`
    : "Open the live view.";

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        title={failed ? "Live numbers aren't available right now." : undefined}
        disabled={!endpoint && !sample}
        onPointerEnter={() => void loadDialog()}
        onFocus={() => void loadDialog()}
        onClick={() => {
          setOpened(true);
          setOpen(true);
        }}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium shadow-xs transition-colors duration-150 ease-out outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-card pointer-coarse:h-11"
      >
        <LiveDot active={total > 0} />
        {loading ? (
          <span className="h-3.5 w-4 animate-pulse rounded-sm bg-muted" aria-hidden="true" />
        ) : count ? (
          <span className="tabular-nums" aria-live="polite">
            {total}
          </span>
        ) : null}
        <span className="text-muted-foreground">live</span>
      </button>
      {opened ? (
        <LiveDialog
          open={open}
          onOpenChange={setOpen}
          endpoint={endpoint}
          sample={sample}
          siteName={siteName}
          signupEvent={signupEvent}
          onCount={setLatest}
          returnFocus={() => button.current?.focus()}
        />
      ) : null}
    </>
  );
}

/** Green and pulsing while someone is there, quiet grey otherwise. */
export function LiveDot({ active, className }: { active: boolean; className?: string }) {
  return (
    <span className={cn("relative flex size-2 shrink-0", className)} aria-hidden="true">
      {active ? (
        <span className="absolute inset-0 rounded-full bg-positive opacity-60 motion-safe:animate-ping" />
      ) : null}
      <span
        className={cn(
          "relative size-2 rounded-full transition-colors duration-300",
          active ? "bg-positive" : "bg-muted-foreground/40",
        )}
      />
    </span>
  );
}
