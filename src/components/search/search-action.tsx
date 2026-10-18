import { CircleCheckIcon } from "lucide-react";
import { formatDay, formatDayRange, formatNumber, formatPosition } from "@/lib/format";
import { ACTION_STEPS, actionFacts } from "@/lib/search-console/action";
import type { FollowUp, WeeklyPick } from "@/lib/search-console/data";
import { SearchActionPicker, type PickView } from "./search-action-picker";

type MarkDone = React.ComponentProps<typeof SearchActionPicker>["markDone"];

const position = (p: number | null) => (p === null ? "not shown" : formatPosition(p));

/** "Since you worked on /x on 3 Oct, “q”: position 11.2 → 7.4, clicks 12 → 30 (14 days each side)." */
export function followUpText(f: FollowUp): string {
  const search = f.query ? `, “${f.query}”` : "";
  return `Since you worked on ${f.label} on ${formatDay(f.day)}${search}: position ${position(f.before.position)} → ${position(f.after.position)}, clicks ${formatNumber(f.before.clicks)} → ${formatNumber(f.after.clicks)} (${f.days} days each side).`;
}

/**
 * This week's one thing (docs/SPEC.md section 31.3), at the top of the Google search
 * card: one page to work on, the numbers behind it, fixed steps, and how last week's
 * page has done since. The only highlighted block in the card.
 */
export function SearchActionPanel({
  pick,
  markDone,
  signupEvent,
}: {
  pick: WeeklyPick;
  markDone: MarkDone;
  signupEvent: string | null;
}) {
  const picks: PickView[] = pick.actions.map((a) => ({
    page: a.page,
    label: a.label,
    facts: actionFacts(a),
    ...ACTION_STEPS[a.kind],
  }));
  const days = pick.window.current;
  return (
    <section
      aria-labelledby="search-action-title"
      className="flex flex-col gap-2 rounded-xl bg-muted p-3 @sm:p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="search-action-title" className="text-sm font-semibold text-primary">
          This week
        </h3>
        <span className="text-xs text-muted-foreground">
          From Google&apos;s numbers for {formatDayRange(days.start, days.end)}
        </span>
      </div>
      {pick.followUp ? <p className="text-sm text-pretty">{followUpText(pick.followUp)}</p> : null}
      {pick.done ? (
        <p className="flex items-start gap-2 text-sm text-pretty">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
          <span>
            Done on {formatDay(pick.done.day)}: you worked on{" "}
            <span className="font-medium break-all">{pick.done.label}</span>
            {pick.done.query ? ` for “${pick.done.query}”` : ""}. How it moves shows here from next
            week, and a new page comes on Monday.
          </span>
        </p>
      ) : picks.length ? (
        <SearchActionPicker picks={picks} markDone={markDone} />
      ) : (
        <p className="text-sm text-pretty">
          Nothing stands out this week: no page is slipping on Google, close to page 1 for a search
          seen often, or seen but rarely clicked.
        </p>
      )}
      {!signupEvent && !pick.done ? (
        <p className="text-xs text-pretty text-muted-foreground">
          Choose your signup event under the Signups number to rank pages by the signups they bring.
        </p>
      ) : null}
    </section>
  );
}
