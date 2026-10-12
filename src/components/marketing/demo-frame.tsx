import { LockIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { demo } from "@/config/demo";
import { brand } from "@/config/theme";
import { HandNote } from "./hand-note";
import { LazyFrame } from "./lazy-frame";

/**
 * The landing page's live demo (docs/SPEC.md section 17): a real public stats page
 * (/demo) inside a browser window, with a fixed height. The page scrolls inside the
 * window and its date menu and tabs work.
 */
export function DemoFrame() {
  const host = new URL(brand.url).host;
  return (
    <div className="relative pt-9">
      <HandNote
        arrow="down-left"
        className="absolute top-0 right-2 text-muted-foreground sm:right-6"
      >
        Interactive demo
      </HandNote>
      <div className="rounded-[1.375rem] border bg-muted/70 p-1.5 shadow-lg sm:p-2">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid h-11 grid-cols-[3.25rem_1fr_3.25rem] items-center gap-3 border-b px-3.5 sm:px-4">
            <div aria-hidden="true" className="flex gap-2">
              <span className="size-3 rounded-full bg-window-close" />
              <span className="size-3 rounded-full bg-window-minimize" />
              <span className="size-3 rounded-full bg-window-zoom" />
            </div>
            <p className="flex min-w-0 items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <LockIcon className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                <span className="hidden sm:inline">https://</span>
                {host}/p/<span className="font-medium text-foreground">{demo.slug}</span>
              </span>
            </p>
          </div>
          <div className="h-[34rem] bg-background sm:h-[42rem] lg:h-[46rem]">
            <LazyFrame
              src="/demo?embed=1"
              title={`${brand.name} live demo: a real public stats page`}
            >
              <DemoPlaceholder />
            </LazyFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The demo's outline while it loads, so the window never looks empty. */
function DemoPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6" aria-hidden="true">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-2/3 max-w-md" />
      <div className="rounded-2xl border bg-card p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-56 rounded-lg" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
