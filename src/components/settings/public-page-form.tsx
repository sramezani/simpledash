"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";

export type PublicPageValues = {
  /** Shown, never edited: it comes from the site's domain. */
  slug: string;
  enabled: boolean;
  indexable: boolean;
  cards: string[];
};

type FormState = {
  error?: string;
  saved?: boolean;
  values?: Omit<PublicPageValues, "slug">;
};

const checkbox = "size-4 shrink-0 accent-primary";

/**
 * Settings → Public page (docs/SPEC.md section 15): on or off, cards, indexing. The address is
 * made from the site's domain and can't be changed, so links to the page never break.
 */
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
  const address = url.replace(/^https?:\/\//, "");
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Address</span>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3">
          {saved.enabled ? (
            <a
              href={url}
              className="min-w-0 flex-1 truncate rounded-md text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {address}
            </a>
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
              {address}
            </span>
          )}
          {saved.enabled ? <CopyButton text={url} /> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Made from your site&apos;s address, so links to the page never break.
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
