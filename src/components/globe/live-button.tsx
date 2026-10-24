"use client";

import { ArrowRightIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { HelpTip } from "@/components/shared/help-tip";
import { cardById } from "@/config/cards";
import { formatNumber } from "@/lib/format";
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
  /** A fixed live view (the demo, the dev preview): no polling at all. */
  sample?: LiveData;
  /** Ask once more 5 seconds in, so an owner who just opened their site sees themselves (dashboard). */
  early?: boolean;
  siteName: string;
  signupEvent: string | null;
};

/**
 * "● Right now 3", the last number of the overview (docs/SPEC.md section 11.10): one small
 * request every 20 seconds. The whole tile opens the live view, whose code (and the globe's)
 * loads only then, fetched early when the pointer or focus reaches it.
 */
export function LiveButton({
  endpoint,
  initial = null,
  sample,
  early = false,
  siteName,
  signupEvent,
}: LiveButtonProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  // The newest count, from this button's polls or from the open view's.
  const [latest, setLatest] = useState<LiveCount | null>(initial);
  // While the view is open it polls everything, count included, so this one rests.
  const polled = useLivePoll<LiveCount>(
    sample || open ? null : endpoint,
    initial,
    setLatest,
    early,
  );
  const count = sample ?? latest;
  const clickable = !!endpoint || !!sample;
  const failed = !sample && !count && polled.failed;
  const loading = !count && !failed;
  const total = count?.total ?? 0;
  const minutes = count?.minutes ?? 30;
  const card = cardById.live;

  const label = count
    ? `${total} ${total === 1 ? "visitor" : "visitors"} in the last ${minutes} minutes. Open the live view.`
    : "Open the live view.";

  return (
    <>
      {/* Its own container: alone on a wide row, the tile lies flat. The number follows the card. */}
      <div className="@container/live h-full min-w-38">
        <div
          className={cn(
            "relative flex h-full flex-col gap-1.5 rounded-xl px-2.5 py-2.5 transition-colors duration-150 ease-out @xs/live:flex-row @xs/live:items-center @xs/live:gap-4 @2xl/overview:px-3.5",
            clickable &&
              "has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring has-[button:hover]:bg-muted/70",
          )}
        >
          <div className="flex h-6 items-center gap-1">
            <h2
              id="live-title"
              className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-muted-foreground"
            >
              <LiveDot active={total > 0} />
              {card.title}
            </h2>
            {/* Above the button's click area, so the help still opens on its own. */}
            <span className="relative z-10 flex">
              <HelpTip id="live" label={card.title}>
                {card.help}
              </HelpTip>
            </span>
          </div>
          <button
            ref={button}
            type="button"
            aria-label={label}
            aria-haspopup="dialog"
            title={failed ? "Live numbers aren't available right now." : undefined}
            disabled={!clickable}
            onPointerEnter={() => void loadDialog()}
            onFocus={() => void loadDialog()}
            onClick={() => {
              setOpened(true);
              setOpen(true);
            }}
            // The click area covers the whole tile.
            className="group/live flex flex-col items-start gap-1.5 text-left outline-none after:absolute after:inset-0 after:rounded-xl enabled:cursor-pointer @xs/live:flex-1 @xs/live:flex-row @xs/live:items-center @xs/live:justify-between @xs/live:gap-4"
          >
            <span className="text-2xl leading-tight font-semibold tracking-tight tabular-nums @md/overview:text-3xl">
              {loading ? (
                <span
                  className="inline-block h-[0.8em] w-[1.2em] animate-pulse rounded-md bg-muted align-middle"
                  aria-hidden="true"
                />
              ) : (
                <span aria-live="polite">{count ? formatNumber(total) : "—"}</span>
              )}
            </span>
            <span className="inline-flex min-h-4 items-center gap-1 text-xs font-medium whitespace-nowrap text-primary">
              Open the globe
              <ArrowRightIcon
                className="size-3.5 shrink-0 transition-transform duration-150 ease-out group-hover/live:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </div>
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
