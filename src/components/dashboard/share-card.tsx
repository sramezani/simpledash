"use client";

import { GlobeIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";

type ShareState = { url?: string; error?: string };

/**
 * "Share your stats publicly?" (docs/SPEC.md section 12): one click creates the page
 * with a slug from the domain and the default cards, then shows the link.
 */
export function ShareCard({
  action,
  settingsHref = "/settings#public",
}: {
  action: () => Promise<ShareState>;
  /** This site's public page settings. */
  settingsHref?: string;
}) {
  const [state, turnOn, pending] = useActionState<ShareState>(action, {});
  return (
    <section
      aria-labelledby="share-title"
      className="@container flex flex-col gap-3 rounded-xl border border-dashed bg-card p-5"
    >
      <div className="flex gap-3">
        <GlobeIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 id="share-title" className="text-sm font-semibold">
            {state.url ? "Your public page is live" : "Share your stats publicly?"}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {state.url
              ? "Anyone with the link can see it. Choose the cards in Settings."
              : "A public page with your visitors, sources and top pages. No notes, no email, nothing private."}
          </p>
        </div>
      </div>
      {state.url ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={state.url}
            className="min-w-0 flex-1 truncate rounded-md text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {state.url.replace(/^https?:\/\//, "")}
          </a>
          <CopyButton text={state.url} />
          <Button asChild variant="ghost" className="h-9 pointer-coarse:h-11">
            <Link href={settingsHref as Route}>Settings</Link>
          </Button>
        </div>
      ) : (
        <form action={turnOn} className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} className="h-9 pointer-coarse:h-11">
            {pending ? "Turning on…" : "Turn on"}
          </Button>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
