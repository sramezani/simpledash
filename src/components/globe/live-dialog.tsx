"use client";

import { XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LiveCount, LiveData, LivePlace } from "@/lib/ga4/live";
import { LivePanel } from "./live-panel";
import { StarField } from "./star-field";
import { fullEndpoint, useLivePoll } from "./use-live-poll";

// MapLibre is big: it loads after the panel, which shows the numbers straight away.
const LiveGlobe = dynamic(() => import("./live-globe").then((m) => m.LiveGlobe), { ssr: false });

type LiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string | null;
  sample?: LiveData;
  siteName: string;
  signupEvent: string | null;
  /** Hands each new count back to the button, so both always agree. */
  onCount: (count: LiveCount) => void;
  /** Focus goes back to the button on close (it isn't a Radix trigger: the view loads later). */
  returnFocus: () => void;
};

/**
 * The live view (docs/SPEC.md section 11.10): the globe with a face for each visitor, and a
 * panel with the numbers. Asks for everything every 20 seconds, only while it is open.
 * Nearly the whole screen on a computer; the whole screen, globe above panel, on a phone.
 */
export default function LiveDialog({
  open,
  onOpenChange,
  endpoint,
  sample,
  siteName,
  signupEvent,
  onCount,
  returnFocus,
}: LiveDialogProps) {
  const handleData = useCallback(
    (data: LiveData) => onCount({ total: data.total, minutes: data.minutes }),
    [onCount],
  );
  const live = useLivePoll<LiveData>(
    open && endpoint && !sample ? fullEndpoint(endpoint) : null,
    null,
    handleData,
  );
  const data = sample ?? live.data;
  const [focus, setFocus] = useState<{ place: LivePlace; at: number } | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
        className="flex h-dvh w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none bg-globe-space p-0 ring-0 sm:max-w-none md:block md:h-[90dvh] md:w-[94vw] md:max-w-400 md:rounded-2xl md:ring-1 md:ring-card/10"
      >
        <DialogClose
          // First in the Tab order, and where focus starts.
          className="absolute top-3 right-3 z-20 flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur-sm transition-colors duration-150 outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring md:top-4 md:right-4"
        >
          <XIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogTitle className="sr-only">Live visitors on {siteName}</DialogTitle>
        <DialogDescription className="sr-only">
          Visitors on {siteName} in the last {data?.minutes ?? 30} minutes: where they are, the
          pages they&apos;re on, their devices and actions. Updates every 20 seconds.
        </DialogDescription>

        <div className="relative h-[46%] shrink-0 md:absolute md:inset-0 md:h-auto">
          <StarField />
          <LiveGlobe places={data?.places ?? []} focus={focus} />
        </div>

        <LivePanel
          data={data}
          failed={!sample && live.failed}
          siteName={siteName}
          signupEvent={signupEvent}
          onSelectPlace={(place) => setFocus({ place, at: Date.now() })}
          className="min-h-0 flex-1 rounded-t-2xl md:absolute md:top-4 md:bottom-auto md:left-4 md:max-h-[calc(100%-2rem)] md:w-96 md:flex-none md:rounded-2xl"
        />
      </DialogContent>
    </Dialog>
  );
}
