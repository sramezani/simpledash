"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BrandFormState = { saved?: boolean; error?: string } | null;

/**
 * "Your name in searches" (docs/SPEC.md section 28.2): the spellings worked out from
 * the address, and other ones the user adds, for "Your name vs others".
 */
export function BrandTermsForm({
  fromDomain,
  extra,
  action,
}: {
  fromDomain: string[];
  extra: string[];
  action: (state: BrandFormState, formData: FormData) => Promise<BrandFormState>;
}) {
  const [state, save, pending] = useActionState(action, null);
  return (
    <form action={save} className="flex flex-col gap-2">
      <Label htmlFor="brand-terms">Your name in searches</Label>
      <p className="text-xs text-pretty text-muted-foreground">
        {fromDomain.length > 0
          ? `Searches containing ${fromDomain.map((t) => `“${t}”`).join(", ")} (from your address) count as your name. Add other spellings, separated by commas.`
          : "We couldn't tell your site's name from its address. Add how people spell it, separated by commas."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="brand-terms"
          name="terms"
          defaultValue={extra.join(", ")}
          placeholder="meet line, meetlineapp"
          autoComplete="off"
          maxLength={1000}
          className="min-w-0 flex-1 sm:max-w-sm pointer-coarse:h-11"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="h-9 pointer-coarse:h-11"
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p aria-live="polite" className="text-xs">
        {state?.error ? (
          <span className="text-destructive">{state.error}</span>
        ) : state?.saved ? (
          <span className="text-muted-foreground">
            Saved. The Google search card uses these now.
          </span>
        ) : null}
      </p>
    </form>
  );
}
