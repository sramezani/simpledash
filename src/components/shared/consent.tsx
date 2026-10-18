"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/config/analytics";
import { brand } from "@/config/theme";
import { cn } from "@/lib/utils";

/**
 * The analytics consent banner and Google Analytics itself (docs/SPEC.md section 17).
 * - Nothing loads before a choice: "Decline" means Google's script never loads at all.
 * - The choice is kept in this browser (localStorage, not a cookie) with its date, and asked
 *   again only after a while: 13 months after "Accept", 6 months after "Decline" (asking more
 *   often would push people towards yes). "Cookie settings" changes it any time.
 * - Never inside a frame (the landing page's demo) or on the unsubscribe page, whose address
 *   holds a private token, and not at all without NEXT_PUBLIC_GA_MEASUREMENT_ID. Off the live
 *   host (development), the banner shows but Google is never loaded.
 */

type Choice = "granted" | "denied";
const KEY = "sd-analytics-consent";
const OPEN_EVENT = "sd-consent-open";
const DAY = 24 * 60 * 60 * 1000;
/** How long a choice holds before the banner asks once more. */
const KEEP_DAYS: Record<Choice, number> = { granted: analytics.cookieDays, denied: 182 };

/** The saved choice, or null when there is none or it's too old. Stored as "granted:<ms>". */
function readChoice(): Choice | null {
  try {
    const [choice, at] = (localStorage.getItem(KEY) ?? "").split(":");
    if (choice !== "granted" && choice !== "denied") return null;
    const age = Date.now() - Number(at);
    return Number.isFinite(age) && age >= 0 && age < KEEP_DAYS[choice] * DAY ? choice : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: Choice) {
  try {
    localStorage.setItem(KEY, `${choice}:${Date.now()}`);
  } catch {
    // Private mode or blocked storage: the choice lasts until the page closes.
  }
}

/** Whether analytics may run on this page at all. */
function allowedHere(): boolean {
  if (!analytics.measurementId || window.self !== window.top) return false;
  return !window.location.pathname.startsWith("/email/");
}

const isLiveHost = () => window.location.hostname === analytics.host;

/** Key events sent before Google's script was ready (or before a choice): sent once it loads. */
let pending: [string, Record<string, unknown>][] = [];

// A tiny store, so the banner and the "Cookie settings" buttons agree without a context.
let asking = false;
let sessionChoice: Choice | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener(OPEN_EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(OPEN_EVENT, listener);
  };
}

/** "off" before hydration and where analytics never runs; "ask" shows the banner. */
function snapshot(): Choice | "ask" | "off" {
  if (!allowedHere()) return "off";
  if (asking) return "ask";
  return readChoice() ?? sessionChoice ?? "ask";
}

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** Loads Google Analytics once, with ads features off. Only on the live host. */
function loadAnalytics() {
  if (!isLiveHost() || window.gtag) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js reads the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", analytics.measurementId, {
    cookie_expires: analytics.cookieDays * 24 * 60 * 60,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics.measurementId)}`;
  document.head.appendChild(script);
  for (const [name, params] of pending) window.gtag("event", name, params);
  pending = [];
}

/**
 * Sends one of SimpleDash's key events (src/lib/analytics/events.ts) to its own Google
 * Analytics, only with consent: sent at once when Google's script runs, kept until the
 * visitor chooses when they haven't yet, and dropped after "Decline". Off the live host it
 * is only written to the console, so development never sends anything.
 */
export function trackEvent(name: string, params: Record<string, unknown>) {
  const state = snapshot();
  if (state === "off" || state === "denied") return;
  if (!isLiveHost()) {
    if (process.env.NODE_ENV !== "production") console.info("[analytics]", name, params);
    return;
  }
  if (window.gtag) window.gtag("event", name, params);
  else pending.push([name, params]);
}

/** Removes Google Analytics' cookies (_ga, _ga_<id>) from this host and the parent domain. */
function clearAnalyticsCookies() {
  const host = window.location.hostname;
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]!.trim();
    if (!name.startsWith("_ga")) continue;
    for (const domain of ["", host, `.${host}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

function choose(choice: Choice) {
  const was = readChoice() ?? sessionChoice;
  saveChoice(choice);
  sessionChoice = choice;
  asking = false;
  if (choice === "denied") pending = [];
  emit();
  if (choice === "denied" && was === "granted") {
    clearAnalyticsCookies();
    // Google's script is already running on this page: a reload is the only clean stop.
    window.location.reload();
  }
}

export function ConsentBanner() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "off" as const);

  useEffect(() => {
    if (state === "granted") loadAnalytics();
  }, [state]);

  if (state !== "ask") return null;
  return (
    <section
      aria-labelledby="consent-title"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border bg-card p-4 shadow-lg sm:right-auto sm:left-4 sm:mx-0"
    >
      <div className="flex flex-col gap-1">
        <h2 id="consent-title" className="text-sm font-semibold">
          This website uses cookies
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          We use Google Analytics to understand how {brand.name} is used, so we can make it better.
          No ads.{" "}
          <Link
            href="/privacy#analytics"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Learn more
          </Link>
        </p>
      </div>
      {/* Same size and side by side: declining is as easy to see and click as accepting. */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 pointer-coarse:h-11"
          onClick={() => choose("denied")}
        >
          Decline
        </Button>
        <Button
          type="button"
          className="h-10 pointer-coarse:h-11"
          onClick={() => choose("granted")}
        >
          Accept
        </Button>
      </div>
    </section>
  );
}

/** Opens the banner again to change the choice ("Cookie settings"). */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        asking = true;
        emit();
      }}
      className={cn("cursor-pointer text-left", className)}
    >
      Cookie settings
    </button>
  );
}
