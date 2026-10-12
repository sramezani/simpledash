"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { formatDay, formatDayRange, formatNumber } from "@/lib/format";

/** A calendar day as YYYY-MM-DD ⇄ a local Date for the calendar. Days only, no time zones. */
function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function firstOfMonth(iso: string, offset = 0): Date {
  const d = toDate(iso);
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}
function daysBetween(start: string, end: string): number {
  return Math.round((toDate(end).getTime() - toDate(start).getTime()) / 86_400_000) + 1;
}

const WIDE = "(min-width: 40rem)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type CustomRangePanelProps = {
  /** The days it opens with (the period shown now). */
  start: string;
  end: string;
  /** The first and last days that can be picked. */
  firstDay: string;
  lastDay: string;
  onApply: (start: string, end: string) => void;
};

/**
 * The custom range calendar (docs/SPEC.md section 8): two months side by side (one
 * on phones), Start and End fields that stay in step with it, Clear and Apply.
 * The first click picks the first day, the second the last day; the days between
 * are shown while pointing. Days after today and before GA4 existed can't be picked.
 */
export default function CustomRangePanel({
  start,
  end,
  firstDay,
  lastDay,
  onApply,
}: CustomRangePanelProps) {
  const id = useId();
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
  const [from, setFrom] = useState<string | null>(start);
  const [to, setTo] = useState<string | null>(end);
  const [hover, setHover] = useState<string | null>(null);
  // The last month on the right: the end's month, with the month before it beside it.
  const [month, setMonth] = useState(() => firstOfMonth(end, wide ? -1 : 0));

  function pick(day: string) {
    if (!from || to) {
      setFrom(day);
      setTo(null);
    } else if (day < from) {
      setTo(from);
      setFrom(day);
    } else {
      setTo(day);
    }
  }

  /** A typed day: kept only when it is a real day that can be picked. */
  function typed(which: "from" | "to", value: string) {
    if (!value) return which === "from" ? setFrom(null) : setTo(null);
    if (value < firstDay || value > lastDay) return;
    if (which === "from") {
      setFrom(value);
      if (to && value > to) setTo(value);
    } else {
      setTo(value);
      if (!from || value < from) setFrom(value);
    }
    setMonth(firstOfMonth(value, which === "to" && wide ? -1 : 0));
  }

  const preview =
    from && !to && hover
      ? hover < from
        ? { from: toDate(hover), to: toDate(from) }
        : { from: toDate(from), to: toDate(hover) }
      : undefined;
  const last = to ?? from;
  const summary = !from
    ? "Pick the first day"
    : !to
      ? `From ${formatDay(from)}. Pick the last day, or apply for one day`
      : `${from === to ? formatDay(from, true) : formatDayRange(from, to)} · ${formatNumber(daysBetween(from, to))} ${from === to ? "day" : "days"}`;

  return (
    <div className="flex flex-col">
      <h2 className="sr-only">Custom date range</h2>
      <Calendar
        mode="range"
        numberOfMonths={wide ? 2 : 1}
        month={month}
        onMonthChange={setMonth}
        startMonth={toDate(firstDay)}
        endMonth={toDate(lastDay)}
        disabled={[{ before: toDate(firstDay) }, { after: toDate(lastDay) }]}
        selected={from ? { from: toDate(from), to: to ? toDate(to) : undefined } : undefined}
        onSelect={(_, day) => pick(toIso(day))}
        onDayMouseEnter={(day) => setHover(toIso(day))}
        onDayMouseLeave={() => setHover(null)}
        modifiers={preview ? { preview } : undefined}
        modifiersClassNames={{ preview: "[&>button]:rounded-none [&>button]:bg-primary/10" }}
        showOutsideDays={false}
        className="p-3 [--cell-size:--spacing(9)] sm:p-4 pointer-coarse:[--cell-size:--spacing(10)]"
        classNames={{ months: "relative flex flex-col gap-6 sm:flex-row sm:gap-8" }}
      />
      <div className="flex flex-col gap-3 border-t p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <label htmlFor={`${id}-start`} className="flex flex-col gap-1.5 text-xs font-medium">
            Start
            <Input
              id={`${id}-start`}
              type="date"
              min={firstDay}
              max={lastDay}
              value={from ?? ""}
              onChange={(e) => typed("from", e.target.value)}
              className="h-9 tabular-nums sm:w-40 pointer-coarse:h-11"
            />
          </label>
          <label htmlFor={`${id}-end`} className="flex flex-col gap-1.5 text-xs font-medium">
            End
            <Input
              id={`${id}-end`}
              type="date"
              min={from ?? firstDay}
              max={lastDay}
              value={to ?? ""}
              onChange={(e) => typed("to", e.target.value)}
              className="h-9 tabular-nums sm:w-40 pointer-coarse:h-11"
            />
          </label>
          <div className="col-span-2 flex items-center justify-end gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="ghost"
              className="h-9 pointer-coarse:h-11"
              onClick={() => {
                setFrom(null);
                setTo(null);
              }}
              disabled={!from}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="h-9 px-4 pointer-coarse:h-11"
              disabled={!from}
              onClick={() => from && last && onApply(from, last)}
            >
              Apply
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {summary}
        </p>
      </div>
    </div>
  );
}
