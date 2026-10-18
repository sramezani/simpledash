"use client";

import { CheckIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";

export type PickView = {
  page: string;
  label: string;
  facts: string[];
  steps: string;
  guide: string;
  guideLabel: string;
};

type State = { error?: string; done?: boolean } | null;

/**
 * This week's pick and the next two (docs/SPEC.md section 31.3). "Show another" only
 * changes what's shown here; "Mark as done" saves a chart note on the server.
 */
export function SearchActionPicker({
  picks,
  markDone,
}: {
  picks: PickView[];
  markDone: (state: State, formData: FormData) => Promise<State>;
}) {
  const [index, setIndex] = useState(0);
  const [state, formAction, pending] = useActionState(markDone, null);
  const pick = picks[index] ?? picks[0]!;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-pretty">
        Work on <span className="break-all">{pick.label}</span>
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-pretty">
        {pick.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <p className="text-sm text-pretty text-muted-foreground">
        <span className="font-medium text-foreground">What to do:</span> {pick.steps}{" "}
        <a
          href={pick.guide}
          className="font-medium whitespace-nowrap text-primary underline-offset-2 hover:underline"
        >
          {pick.guideLabel}
        </a>
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <form action={formAction}>
          <input type="hidden" name="page" value={pick.page} />
          <Button type="submit" disabled={pending} className="h-9 gap-1.5 pointer-coarse:h-11">
            <CheckIcon aria-hidden="true" />
            {pending ? "Saving…" : "Mark as done"}
          </Button>
        </form>
        {picks.length > 1 ? (
          <Button
            type="button"
            variant="ghost"
            className="h-9 pointer-coarse:h-11"
            onClick={() => setIndex((index + 1) % picks.length)}
          >
            Show another
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {index + 1} of {picks.length}
            </span>
          </Button>
        ) : null}
      </div>
      <p aria-live="polite" className="text-sm empty:hidden">
        {state?.error ?? (state?.done ? "Marked as done. It's on your chart as a note." : "")}
      </p>
    </div>
  );
}
