import { PauseIcon, PlayIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { Flag } from "@/components/shared/flag";
import { TimeAgo } from "@/components/shared/time-ago";
import { formatNumber } from "@/lib/format";
import type { TickerItem } from "@/lib/public-page/footer-data";

/** Without live numbers the band holds these, still, at the same height: nothing moves when they arrive. */
const FACTS = ["No tracking script", "Read-only Google access", "Open source"];

/**
 * The footer's live band (docs/SPEC.md section 17): SimpleDash's own live numbers sliding by.
 * CSS only. It stops on hover, with its pause switch (a checkbox, so it needs no JavaScript;
 * keyboard users can stop it too), and for reduced motion.
 */
export function FooterBand({
  items,
  checkedAt,
  label,
}: {
  items: TickerItem[];
  checkedAt: string | null;
  /** The site the numbers are from: "simpledash.app". */
  label: string;
}) {
  return (
    <div className="border-y border-footer-foreground/15 bg-footer-foreground/5 backdrop-blur-md">
      {items.length > 0 ? <Marquee items={items} checkedAt={checkedAt} label={label} /> : <Facts />}
    </div>
  );
}

function Facts() {
  return (
    <ul className="flex h-12 items-center justify-center gap-x-6 px-4 text-sm text-footer-muted">
      {FACTS.map((fact, i) => (
        <li key={fact} className="flex items-center gap-6 whitespace-nowrap max-sm:last:hidden">
          {i > 0 ? <Dot /> : null}
          {fact}
        </li>
      ))}
    </ul>
  );
}

function Dot() {
  return <span aria-hidden="true" className="size-1 rounded-full bg-footer-muted/50" />;
}

function Marquee({
  items,
  checkedAt,
  label,
}: {
  items: TickerItem[];
  checkedAt: string | null;
  label: string;
}) {
  // About the same speed whatever the number of lines.
  const style = { "--marquee-time": `${(items.length + 1) * 6}s` } as CSSProperties;
  const copy = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-6 pr-6 motion-reduce:aria-hidden:hidden"
    >
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-6 whitespace-nowrap">
          <span className="flex items-center gap-2">
            {item.live ? <LiveDot /> : null}
            {item.countryCode ? <Flag code={item.countryCode} /> : null}
            <span>
              <span className="font-semibold text-footer-foreground tabular-nums">
                {formatNumber(item.value)}
              </span>{" "}
              <span className="text-footer-muted">{item.text}</span>
            </span>
          </span>
          <Dot />
        </li>
      ))}
      {checkedAt ? (
        <li className="flex items-center gap-6 whitespace-nowrap text-footer-muted">
          <span>
            Checked <TimeAgo at={checkedAt} />
          </span>
          <Dot />
        </li>
      ) : null}
    </ul>
  );
  return (
    <section aria-label={`Live on ${label}`} className="footer-live flex h-12 items-center">
      <div className="footer-band min-w-0 flex-1 overflow-hidden">
        <div className="footer-marquee flex w-max items-center text-sm" style={style}>
          {copy(false)}
          {copy(true)}
        </div>
      </div>
      <label className="flex h-full shrink-0 cursor-pointer items-center border-l border-footer-border px-4 text-footer-muted transition-colors hover:text-footer-foreground has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-footer-accent motion-reduce:hidden">
        <input type="checkbox" className="peer sr-only" />
        <PauseIcon className="size-4 peer-checked:hidden" aria-hidden="true" />
        <PlayIcon className="hidden size-4 peer-checked:block" aria-hidden="true" />
        <span className="sr-only">Pause the live numbers</span>
      </label>
    </section>
  );
}

/** A soft ping behind a solid dot: live. */
function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-footer-live-dot opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-footer-live-dot" />
    </span>
  );
}
