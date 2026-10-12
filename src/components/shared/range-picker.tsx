"use client";

import { CalendarDaysIcon, CalendarIcon, ChevronDownIcon, LoaderCircleIcon } from "lucide-react";
import type { Route } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { formatDay, formatDayRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { chipButtonClass } from "./site-chip";

/** What the menu needs (rangeMenu in src/lib/ga4/ranges.ts builds it on the server). */
export type RangePickerProps = {
  /** The range shown now ("7d", "2026-09-01..2026-09-30") and its label. */
  value: string;
  label: string;
  presets: { value: string; label: string; href: string; shortcut: string; separated: boolean }[];
  custom: {
    href: string;
    slot: string;
    start: string;
    end: string;
    firstDay: string;
    lastDay: string;
  };
};

const loadPanel = () => import("./custom-range-panel");
/** The calendar loads the first time it's needed, so pages don't carry it otherwise. */
const CustomRangePanel = dynamic(loadPanel, {
  ssr: false,
  loading: () => (
    <div className="flex h-[25rem] w-[min(36rem,calc(100vw-2rem))] items-center justify-center">
      <LoaderCircleIcon
        className="size-5 animate-spin text-muted-foreground"
        aria-label="Loading"
      />
    </div>
  ),
});

const CUSTOM_KEY = "C";

/**
 * The date menu above the overview ("Last 7 days ⌄"), like DataFast's: the presets
 * with their keys (pressing one while the menu is open picks it), and "Custom",
 * which opens a calendar for any run of days. Every choice is a page address
 * (`?range=`), so the server renders the new range. The label changes at once and a
 * small spinner shows while the new numbers load.
 */
export function RangePicker({ value, label, presets, custom }: RangePickerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic({ value, label });
  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Set while the menu closes to open the calendar: it opens once the menu has finished
  // closing, so the menu's focus handling doesn't close it again.
  const toCalendar = useRef(false);
  const isCustom = !presets.some((p) => p.value === shown.value);

  function go(next: { value: string; label: string; href: string }) {
    setMenuOpen(false);
    setCalendarOpen(false);
    if (next.value === shown.value) return;
    startTransition(() => {
      setShown({ value: next.value, label: next.label });
      router.push(next.href as Route, { scroll: false });
    });
  }

  function openCalendar() {
    void loadPanel();
    toCalendar.current = true;
    setMenuOpen(false);
  }

  function applyCustom(start: string, end: string) {
    const range = `${start}..${end}`;
    go({
      value: range,
      label: start === end ? formatDay(start) : formatDayRange(start, end),
      href: custom.href.replace(custom.slot, range),
    });
  }

  /** The menu's keys: T, Y, W, M, L for the presets and C for Custom (only while it's open). */
  function onMenuKey(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toUpperCase();
    const preset = presets.find((p) => p.shortcut === key);
    if (preset) {
      event.preventDefault();
      go(preset);
    } else if (key === CUSTOM_KEY) {
      event.preventDefault();
      openCalendar();
    }
  }

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
        <PopoverAnchor asChild>
          <DropdownMenuTrigger
            className={cn(
              chipButtonClass,
              "group/range",
              calendarOpen && "bg-muted/60 shadow-none",
            )}
          >
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="whitespace-nowrap">
              <span className="sr-only">Date range: </span>
              {shown.label}
            </span>
            {pending ? (
              <LoaderCircleIcon
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Loading"
              />
            ) : (
              <ChevronDownIcon
                className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]/range:rotate-180"
                aria-hidden="true"
              />
            )}
          </DropdownMenuTrigger>
        </PopoverAnchor>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-56 p-1.5 duration-150"
          onKeyDown={onMenuKey}
          onCloseAutoFocus={(event) => {
            if (toCalendar.current) {
              event.preventDefault();
              toCalendar.current = false;
              setCalendarOpen(true);
            }
          }}
        >
          <DropdownMenuRadioGroup
            value={isCustom ? "" : shown.value}
            onValueChange={(next) => {
              const preset = presets.find((p) => p.value === next);
              if (preset) go(preset);
            }}
          >
            {presets.map((preset) => (
              <Fragment key={preset.value}>
                {preset.separated ? <DropdownMenuSeparator /> : null}
                <DropdownMenuRadioItem
                  value={preset.value}
                  className="group/item h-9 cursor-pointer gap-3 rounded-md pr-2 pl-2.5 transition-colors duration-100 data-[state=checked]:font-medium pointer-coarse:h-11 [&>[data-slot=dropdown-menu-radio-item-indicator]]:right-2.5"
                >
                  <span className="flex-1">{preset.label}</span>
                  <Kbd className="group-data-[state=checked]/item:invisible">{preset.shortcut}</Kbd>
                </DropdownMenuRadioItem>
              </Fragment>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openCalendar();
            }}
            onPointerEnter={() => void loadPanel()}
            onFocus={() => void loadPanel()}
            className={cn(
              "h-9 cursor-pointer gap-3 rounded-md pr-2 pl-2.5 transition-colors duration-100 pointer-coarse:h-11",
              isCustom && "font-medium",
            )}
          >
            <span className="flex-1">Custom…</span>
            {isCustom ? (
              <span className="text-xs text-muted-foreground">{shown.label}</span>
            ) : (
              <Kbd>{CUSTOM_KEY}</Kbd>
            )}
            <CalendarDaysIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={16}
        aria-label="Custom date range"
        className="max-h-(--radix-popover-content-available-height) w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl p-0 duration-150"
      >
        <CustomRangePanel
          start={custom.start}
          end={custom.end}
          firstDay={custom.firstDay}
          lastDay={custom.lastDay}
          onApply={applyCustom}
        />
      </PopoverContent>
    </Popover>
  );
}

/** A key hint in the menu ("T"). Not on touch screens, which have no keys to press. */
function Kbd({ children, className }: { children: string; className?: string }) {
  return (
    <kbd
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 items-center justify-center rounded border bg-muted font-mono text-xs text-muted-foreground pointer-coarse:hidden",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
