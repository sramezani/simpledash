"use client";

import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";
import { useId, useSyncExternalStore } from "react";
import {
  readThemeChoice,
  THEME_EVENT,
  THEME_KEY,
  type ThemeChoice,
} from "@/components/shared/theme-pref";
import { cn } from "@/lib/utils";

/**
 * The theme choice, read from the browser. Null on the server and before hydration:
 * the switch draws the choice from `<html data-theme>` with CSS until then, so it never
 * flashes the wrong one.
 */
export function useThemeChoice(): ThemeChoice | null {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(THEME_EVENT, onChange);
      return () => window.removeEventListener(THEME_EVENT, onChange);
    },
    () => {
      try {
        return readThemeChoice(localStorage.getItem(THEME_KEY));
      } catch {
        return "system";
      }
    },
    () => null,
  );
}

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

/**
 * Saves the choice and applies it. When the page actually changes colour, the new theme
 * grows out of `from` as a circle (a view transition); without view transitions, or with
 * reduced motion, it changes at once with no colour transitions running.
 */
export function setThemeChoice(choice: ThemeChoice, from?: { x: number; y: number }) {
  const root = document.documentElement;
  const apply = () => {
    try {
      if (choice === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, choice);
    } catch {
      // Storage blocked (private mode): the choice still applies to this page.
      if (choice === "system") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", choice);
    }
    if (window.__sdTheme) window.__sdTheme();
    else root.classList.toggle("dark", choice === "dark" || (choice === "system" && prefersDark()));
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const willBeDark = choice === "dark" || (choice === "system" && prefersDark());
  const changes = willBeDark !== root.classList.contains("dark");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!changes || still || !from || !document.startViewTransition) {
    // Colours swap in one frame, without each control fading at its own speed.
    root.classList.add("theme-instant");
    apply();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-instant")),
    );
    return;
  }
  root.classList.add("theme-switching");
  const transition = document.startViewTransition(apply);
  transition.ready
    .then(() => {
      const radius = Math.hypot(
        Math.max(from.x, window.innerWidth - from.x),
        Math.max(from.y, window.innerHeight - from.y),
      );
      root.animate(
        {
          clipPath: [
            `circle(0px at ${from.x}px ${from.y}px)`,
            `circle(${radius}px at ${from.x}px ${from.y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  transition.finished.finally(() => root.classList.remove("theme-switching"));
}

export const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
];

/**
 * The classes that apply while an option is the choice, keyed on `<html data-theme>` (no
 * attribute is System), so they're right before hydration too. Static strings, so Tailwind
 * sees them.
 */
const THUMB = "[[data-theme=light]_&]:translate-x-full [[data-theme=dark]_&]:translate-x-[200%]";
const ICON_TURN: Record<ThemeChoice, string> = {
  system: "[:root:not([data-theme])_&]:scale-110",
  light: "[[data-theme=light]_&]:rotate-90",
  dark: "[[data-theme=dark]_&]:-rotate-[20deg]",
};

const TONES = {
  /** On the page: a quiet pill with a raised thumb. */
  default: {
    group: "border bg-muted/70",
    thumb: "bg-card shadow-sm ring-1 ring-border/70",
    option: "text-muted-foreground hover:text-foreground peer-focus-visible:outline-ring",
    picked: {
      system: "[:root:not([data-theme])_&]:text-foreground",
      light: "[[data-theme=light]_&]:text-foreground",
      dark: "[[data-theme=dark]_&]:text-foreground",
    },
  },
  /** On the footer's brand band: frosted, with a white thumb. */
  footer: {
    group: "border border-footer-foreground/25 bg-footer-foreground/10 backdrop-blur-md",
    thumb: "bg-footer-accent shadow-sm",
    option:
      "text-footer-muted hover:text-footer-foreground peer-focus-visible:outline-footer-accent",
    picked: {
      system: "[:root:not([data-theme])_&]:text-footer",
      light: "[[data-theme=light]_&]:text-footer",
      dark: "[[data-theme=dark]_&]:text-footer",
    },
  },
} satisfies Record<
  string,
  { group: string; thumb: string; option: string; picked: Record<ThemeChoice, string> }
>;

/**
 * System · Light · Dark (docs/SPEC.md section 18): three icon radios in a pill, with a thumb
 * that glides to the choice and an icon that turns as it's picked. Arrow keys move between
 * them, like any radio group. The choice is kept in this browser.
 */
export function ThemeSwitch({
  tone = "default",
  className,
}: {
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const name = useId();
  const choice = useThemeChoice();
  const t = TONES[tone];
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "relative isolate inline-grid shrink-0 grid-cols-3 rounded-full p-0.5",
        t.group,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0.5 left-0.5 -z-10 w-[calc((100%-0.25rem)/3)] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
          t.thumb,
          THUMB,
        )}
      />
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <label key={value} title={label} className="relative">
          <input
            type="radio"
            name={name}
            value={value}
            checked={choice === value}
            onChange={(event) => {
              const box = event.currentTarget.parentElement!.getBoundingClientRect();
              setThemeChoice(value, { x: box.left + box.width / 2, y: box.top + box.height / 2 });
            }}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 pointer-coarse:size-10",
              t.option,
              t.picked[value],
            )}
          >
            <Icon
              className={cn(
                "size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-coarse:size-4",
                ICON_TURN[value],
              )}
              aria-hidden="true"
            />
            <span className="sr-only">{label}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
