"use client";

import { CheckIcon } from "lucide-react";
import { useId } from "react";
import { setThemeChoice, THEME_OPTIONS, useThemeChoice } from "@/components/shared/theme-switch";
import { themeScopeCss } from "@/lib/theme/css";
import type { ThemeChoice } from "@/components/shared/theme-pref";
import { cn } from "@/lib/utils";

const scopeCss = themeScopeCss();

/** The picked tile, from `<html data-theme>` (none is System), so it's right before hydration. */
const PICKED: Record<ThemeChoice, string> = {
  system: "[:root:not([data-theme])_&]:border-primary [:root:not([data-theme])_&]:ring-2",
  light: "[[data-theme=light]_&]:border-primary [[data-theme=light]_&]:ring-2",
  dark: "[[data-theme=dark]_&]:border-primary [[data-theme=dark]_&]:ring-2",
};
const CHECK: Record<ThemeChoice, string> = {
  system: "[:root:not([data-theme])_&]:scale-100 [:root:not([data-theme])_&]:opacity-100",
  light: "[[data-theme=light]_&]:scale-100 [[data-theme=light]_&]:opacity-100",
  dark: "[[data-theme=dark]_&]:scale-100 [[data-theme=dark]_&]:opacity-100",
};

/**
 * Settings → Profile → Appearance (docs/SPEC.md section 18): System, Light and Dark as three
 * tiles, each a small drawing of the dashboard in its own colours (System is split between
 * the two). Picking one changes the whole page at once, with the same circle as the switch.
 */
export function AppearancePicker() {
  const name = useId();
  const choice = useThemeChoice();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scopeCss }} />
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3 sm:gap-4">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label key={value} className="group flex min-w-0 flex-col gap-2.5">
            <input
              type="radio"
              name={name}
              value={value}
              checked={choice === value}
              onChange={(event) => {
                const box = event.currentTarget.nextElementSibling!.getBoundingClientRect();
                setThemeChoice(value, {
                  x: box.left + box.width / 2,
                  y: box.top + box.height / 2,
                });
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "relative block aspect-[4/3] overflow-hidden rounded-xl border ring-primary ring-offset-2 ring-offset-card transition-[box-shadow,border-color,translate] duration-200 ease-out group-hover:-translate-y-0.5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring",
                PICKED[value],
              )}
            >
              {value === "system" ? (
                <>
                  <MiniDashboard scope="light" />
                  <MiniDashboard
                    scope="dark"
                    className="[clip-path:polygon(58%_0,100%_0,100%_100%,42%_100%)]"
                  />
                </>
              ) : (
                <MiniDashboard scope={value} />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1.5 right-1.5 flex size-5 scale-50 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-sm transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  CHECK[value],
                )}
              >
                <CheckIcon className="size-3" strokeWidth={3} />
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {label}
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

/** The dashboard in miniature: top bar, three numbers, the visitors line and a short list. */
function MiniDashboard({ scope, className }: { scope: "light" | "dark"; className?: string }) {
  return (
    <span
      data-theme-scope={scope}
      aria-hidden="true"
      className={cn("absolute inset-0 flex flex-col gap-[6%] bg-background p-[8%]", className)}
    >
      <span className="flex items-center gap-[4%]">
        <span className="h-1 w-3 rounded-full bg-brand" />
        <span className="h-1 w-1/3 rounded-full bg-muted-foreground/35" />
        <span className="ml-auto size-2 rounded-full bg-muted" />
      </span>
      <span className="flex flex-1 flex-col gap-[8%] rounded-md border bg-card p-[6%]">
        <span className="grid grid-cols-3 gap-[8%]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-[3px]">
              <span className="h-[3px] w-2/3 rounded-full bg-muted-foreground/40" />
              <span className="h-1.5 w-full rounded-full bg-foreground/80" />
            </span>
          ))}
        </span>
        <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full flex-1 text-chart-1">
          <path
            d="M0 26 L14 22 L28 24 L42 15 L56 18 L70 9 L84 12 L100 4 L100 32 L0 32 Z"
            fill="currentColor"
            opacity="0.16"
          />
          <path
            d="M0 26 L14 22 L28 24 L42 15 L56 18 L70 9 L84 12 L100 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col gap-[3px] rounded-md border bg-card p-[5%]">
        {[0.9, 0.6, 0.35].map((share) => (
          <span key={share} className="relative h-1.5 overflow-hidden rounded-sm">
            <span
              className="absolute inset-y-0 left-0 rounded-sm bg-chart-1/20"
              style={{ width: `${share * 100}%` }}
            />
          </span>
        ))}
      </span>
    </span>
  );
}
