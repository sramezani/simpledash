"use client";

import { fontVariables } from "@/lib/theme/fonts";
import { ThemeStyle } from "@/lib/theme/theme-style";
import "./globals.css";

/** Shown when the root layout itself fails. It has its own <html>, so it adds the theme again. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <ThemeStyle />
        <title>Something went wrong · SimpleDash</title>
      </head>
      <body className="flex min-h-dvh items-center justify-center p-6">
        <main className="flex max-w-md flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t load this page. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
