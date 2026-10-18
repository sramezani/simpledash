"use client";

import { useEffect, useRef } from "react";
import { checkoutEvent, type AnalyticsEvent } from "@/lib/analytics/events";
import { trackEvent } from "@/components/shared/consent";

/**
 * Sends key events once, when the page opens (docs/SPEC.md section 17), then takes their
 * markers out of the address, so a reload or a shared link never sends them again.
 */
export function SendEvents({
  events,
  clearParams = [],
}: {
  events: AnalyticsEvent[];
  clearParams?: string[];
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (!sent.current) {
      sent.current = true;
      for (const event of events) trackEvent(event.name, event.params);
    }
    // A tick later: the router's own effect runs after this one and would put the old
    // address back.
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      const before = url.search;
      for (const param of clearParams) url.searchParams.delete(param);
      if (url.search !== before) window.history.replaceState(null, "", url);
    }, 0);
    return () => clearTimeout(timer);
  }, [events, clearParams]);
  return null;
}

/** Inside the upgrade form: sends `begin_checkout` for the chosen interval when it's sent. */
export function CheckoutEvent() {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = marker.current?.closest("form");
    if (!form) return;
    const onSubmit = () => {
      const event = checkoutEvent(new FormData(form).get("interval") === "year" ? "year" : "month");
      trackEvent(event.name, event.params);
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);
  return <span ref={marker} hidden />;
}
