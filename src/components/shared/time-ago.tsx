"use client";

import { useSyncExternalStore } from "react";
import { formatAgo, formatTime } from "@/lib/format";

const STEP = 30_000;
const subscribe = (tick: () => void) => {
  const timer = setInterval(tick, STEP);
  return () => clearInterval(timer);
};
const nowStep = () => Math.floor(Date.now() / STEP);
const onServer = () => null;

/**
 * "6 minutes ago", worked out in the browser: a cached page can't know how old it is.
 * Before that (and without JavaScript) it reads "at 14:20 UTC".
 */
export function TimeAgo({ at }: { at: string }) {
  const step = useSyncExternalStore(subscribe, nowStep, onServer);
  const date = new Date(at);
  return (
    <time dateTime={at}>
      {step === null ? `at ${formatTime(date)} UTC` : formatAgo(date, new Date(step * STEP))}
    </time>
  );
}
