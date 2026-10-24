"use client";

import { useEffect, useRef, useState } from "react";
import { LIVE_EARLY, LIVE_REFRESH } from "@/lib/ga4/freshness";

/** As often as the server refreshes its answer, with a little spread so tabs don't all ask at once. */
const nextDelay = () => LIVE_REFRESH - 2_000 + Math.random() * 4_000;

/**
 * Polls a live endpoint while `endpoint` is set and the tab is visible, and asks again
 * straight away when the tab comes back (docs/SPEC.md section 11.10). Keeps the last
 * answer when a poll fails: `failed` is only true while there's nothing to show.
 */
export function useLivePoll<T>(
  endpoint: string | null,
  initial: T | null,
  /** Called with each new answer too (the live button keeps one count for both of its sources). */
  onData?: (data: T) => void,
  /** Ask once, 5 seconds in, for an answer at most 5 seconds old (`fresh=1`): the dashboard only. */
  early = false,
) {
  const [data, setData] = useState<T | null>(initial);
  const [failed, setFailed] = useState(false);
  // Once per page: closing the live view starts this poll again, but not the early ask.
  const earlyLeft = useRef(early);
  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    if (!endpoint) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const poll = async (fresh = false) => {
      clearTimeout(timer);
      if (fresh) earlyLeft.current = false;
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch(fresh ? withParam(endpoint, "fresh=1") : endpoint, {
            cache: "no-store",
          });
          if (!response.ok) throw new Error(String(response.status));
          const next = (await response.json()) as T;
          if (!stopped) {
            setData(next);
            setFailed(false);
            onDataRef.current?.(next);
          }
        } catch {
          // Try again next time.
          if (!stopped) setFailed(true);
        }
      }
      if (!stopped) schedule();
    };
    const schedule = () => {
      timer = earlyLeft.current
        ? setTimeout(() => void poll(true), LIVE_EARLY)
        : setTimeout(() => void poll(), nextDelay());
    };
    if (initial) schedule();
    else timer = setTimeout(() => void poll(), 0);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endpoint, initial]);

  return { data, failed: failed && data === null };
}

const withParam = (endpoint: string, param: string) =>
  `${endpoint}${endpoint.includes("?") ? "&" : "?"}${param}`;

/** The live view's address: the count endpoint with `view=full`. */
export function fullEndpoint(endpoint: string): string {
  return withParam(endpoint, "view=full");
}
