"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type SignupPickState = { error?: string; saved?: boolean } | null;

type SignupPickerFormProps = {
  keyEvents: string[];
  current: string | null;
  action: (state: SignupPickState, formData: FormData) => Promise<SignupPickState>;
};

/** The key-event select. Shows why a save failed, and closes its "Change" panel after a save. */
export function SignupPickerForm({ keyEvents, current, action }: SignupPickerFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  const known = current !== null && keyEvents.includes(current);

  useEffect(() => {
    if (state?.saved) form.current?.closest<HTMLElement>("[popover]")?.hidePopover();
  }, [state]);

  return (
    <form ref={form} action={formAction} className="flex flex-col gap-2">
      {current ? null : <p className="text-sm font-medium">Which action means a signup?</p>}
      {current && !known ? (
        <p className="text-xs text-warning">
          &ldquo;{current}&rdquo; is no longer a key event in Google Analytics. Pick another one.
        </p>
      ) : null}
      <label htmlFor="signup-event" className="sr-only">
        Signup event
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id="signup-event"
          name="event"
          required
          defaultValue={known ? current : ""}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-card px-2.5 text-sm pointer-coarse:h-11"
        >
          {known ? null : (
            <option value="" disabled>
              Pick an event
            </option>
          )}
          {keyEvents.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          variant={current ? "outline" : "default"}
          className="h-9"
          disabled={pending}
        >
          {pending ? "Saving…" : current ? "Save" : "Use this"}
        </Button>
      </div>
      {state?.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only events marked as key events in Google Analytics are listed.
        </p>
      )}
    </form>
  );
}
