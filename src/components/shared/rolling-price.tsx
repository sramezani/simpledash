import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Values that change with the Monthly / Yearly switch (BillingSwitch). Both values
 * are in the page; CSS shows one through `group-has-[…]/billing`, so the switch
 * still needs no JavaScript. The parent must have the `group/billing` class.
 */

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** One digit as a reel of 0–9 that rolls from the monthly digit to the yearly one. */
function Reel({ from, to, delay }: { from: number; to: number; delay: number }) {
  return (
    <span className="inline-block h-[1em] overflow-hidden">
      <span
        style={
          {
            "--from": `${-from * 10}%`,
            "--to": `${-to * 10}%`,
            transitionDelay: `${delay}ms`,
          } as CSSProperties
        }
        className={cn(
          "flex translate-y-(--from) flex-col transition-transform duration-700 group-has-[[data-option-index='1']:checked]/billing:translate-y-(--to)",
          ease,
        )}
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-[1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/** A character only one of the two values has: it grows in or out sideways. */
function Grow({ show, children }: { show: "month" | "year"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-grid transition-[grid-template-columns,opacity] duration-500",
        ease,
        show === "month"
          ? "grid-cols-[1fr] group-has-[[data-option-index='1']:checked]/billing:grid-cols-[0fr] group-has-[[data-option-index='1']:checked]/billing:opacity-0"
          : "grid-cols-[0fr] opacity-0 group-has-[[data-option-index='1']:checked]/billing:grid-cols-[1fr] group-has-[[data-option-index='1']:checked]/billing:opacity-100",
      )}
    >
      <span className="min-w-0 overflow-hidden">{children}</span>
    </span>
  );
}

const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";

/** Splits "$1,234" into its prefix ("$"), number ("1,234") and suffix (""). */
function parts(value: string) {
  const first = value.search(/\d/);
  const last = value.length - [...value].reverse().join("").search(/\d/);
  if (first < 0) return { prefix: value, number: "", suffix: "" };
  return {
    prefix: value.slice(0, first),
    number: value.slice(first, last),
    suffix: value.slice(last),
  };
}

/**
 * A price that rolls like an odometer when the switch moves between Monthly and
 * Yearly ("$9" ⇄ "$90"). Screen readers get the plain value that is showing.
 */
export function RollingPrice({
  month,
  year,
  className,
}: {
  month: string;
  year: string;
  className?: string;
}) {
  const a = parts(month);
  const b = parts(year);
  // The numbers line up from the right, like an odometer.
  const width = Math.max(a.number.length, b.number.length);
  const left = a.number.padStart(width, " ");
  const right = b.number.padStart(width, " ");
  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only group-has-[[data-option-index='1']:checked]/billing:hidden">
        {month}
      </span>
      <span className="sr-only hidden group-has-[[data-option-index='1']:checked]/billing:inline">
        {year}
      </span>
      <span aria-hidden="true" className="inline-flex leading-none tabular-nums">
        {a.prefix === b.prefix ? a.prefix : <Swap month={a.prefix} year={b.prefix} />}
        {[...left].map((m, i) => {
          const y = right[i];
          const delay = (width - 1 - i) * 60;
          if (isDigit(m) && isDigit(y)) {
            return <Reel key={i} from={Number(m)} to={Number(y)} delay={delay} />;
          }
          if (m === y) return <span key={i}>{m}</span>;
          if (m === " " && isDigit(y)) {
            return (
              <Grow key={i} show="year">
                <Reel from={0} to={Number(y)} delay={delay} />
              </Grow>
            );
          }
          if (y === " " && isDigit(m)) {
            return (
              <Grow key={i} show="month">
                <Reel from={Number(m)} to={0} delay={delay} />
              </Grow>
            );
          }
          return <Swap key={i} month={m === " " ? "" : m} year={y === " " || !y ? "" : y} />;
        })}
        {a.suffix === b.suffix ? a.suffix : <Swap month={a.suffix} year={b.suffix} />}
      </span>
    </span>
  );
}

/** Text that crossfades with the switch, e.g. "/ month" ⇄ "/ year". */
export function Swap({
  month,
  year,
  className,
}: {
  month: ReactNode;
  year: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-grid", className)}>
      <span className="sr-only group-has-[[data-option-index='1']:checked]/billing:hidden">
        {month}
      </span>
      <span className="sr-only hidden group-has-[[data-option-index='1']:checked]/billing:inline">
        {year}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "col-start-1 row-start-1 transition-[opacity,translate] duration-300 group-has-[[data-option-index='1']:checked]/billing:-translate-y-1 group-has-[[data-option-index='1']:checked]/billing:opacity-0",
          ease,
        )}
      >
        {month}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "col-start-1 row-start-1 translate-y-1 opacity-0 transition-[opacity,translate] duration-300 group-has-[[data-option-index='1']:checked]/billing:translate-y-0 group-has-[[data-option-index='1']:checked]/billing:opacity-100",
          ease,
        )}
      >
        {year}
      </span>
    </span>
  );
}

/** Content that only shows for Yearly, opening smoothly (e.g. "Save $18"). */
export function YearlyOnly({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "invisible grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility] duration-500 group-has-[[data-option-index='1']:checked]/billing:visible group-has-[[data-option-index='1']:checked]/billing:grid-rows-[1fr] group-has-[[data-option-index='1']:checked]/billing:opacity-100",
        ease,
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
