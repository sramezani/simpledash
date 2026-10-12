"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PublicPageValues = {
  slug: string;
  enabled: boolean;
  indexable: boolean;
  cards: string[];
};

type FormState = { error?: string; saved?: boolean; values?: PublicPageValues };

const checkbox = "size-4 shrink-0 accent-primary";

/** Settings → Public page (docs/SPEC.md section 15): on or off, address, cards, indexing. */
export function PublicPageForm({
  action,
  values: saved,
  base,
  cardOptions,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  values: PublicPageValues;
  /** "https://simpledash.app/p/" */
  base: string;
  cardOptions: { id: string; title: string; note?: string }[];
}) {
  const [state, save, pending] = useActionState(action, {});
  // After a rejected save, show what was sent: React resets the form to these defaults.
  const values = state.values ?? saved;
  const url = `${base}${saved.slug}`;
  return (
    <form action={save} className="flex flex-col gap-5">
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={values.enabled}
          className={checkbox}
        />
        Public page is on
      </label>

      {saved.enabled ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3">
          <a
            href={url}
            className="min-w-0 flex-1 truncate rounded-md text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {url.replace(/^https?:\/\//, "")}
          </a>
          <CopyButton text={url} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="public-slug">Address</Label>
        <div className="flex min-w-0 items-center gap-1 text-sm">
          <span className="shrink-0 text-muted-foreground">{base.replace(/^https?:\/\//, "")}</span>
          <Input
            id="public-slug"
            name="slug"
            defaultValue={values.slug}
            required
            minLength={3}
            maxLength={40}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="public-slug-help"
            className="min-w-0 flex-1 pointer-coarse:h-11"
          />
        </div>
        <p id="public-slug-help" className="text-xs text-muted-foreground">
          Lowercase letters, numbers and dashes. Changing it breaks links to the old address.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Cards to show</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {cardOptions.map((card) => (
            <label key={card.id} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="cards"
                value={card.id}
                defaultChecked={values.cards.includes(card.id)}
                className={`${checkbox} mt-0.5`}
              />
              <span>
                {card.title}
                {card.note ? (
                  <span className="block text-xs text-muted-foreground">{card.note}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Chart notes are never shown.</p>
      </fieldset>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="indexable"
          defaultChecked={values.indexable}
          className={checkbox}
        />
        Let search engines index this page
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="h-9 pointer-coarse:h-11">
          {pending ? "Saving…" : "Save"}
        </Button>
        <p aria-live="polite" className="text-sm">
          {state.error ? (
            <span className="text-destructive">{state.error}</span>
          ) : state.saved && !pending ? (
            <span className="text-muted-foreground">Saved.</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
