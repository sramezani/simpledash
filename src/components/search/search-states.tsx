import { SearchIcon, SparklesIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { GoogleButton } from "@/components/shared/google-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchProblem } from "@/lib/search-console/client";
import { cn } from "@/lib/utils";
import { plans } from "@/config/plans";

/** The Google search card's frame for states without numbers. */
function Frame({
  children,
  dashed,
  className,
}: {
  children: ReactNode;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="search-title"
      className={cn(
        "@container flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:p-5",
        dashed && "border-dashed shadow-none",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Title({ children = "Google search" }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Image src="/google-g.svg" alt="" width={16} height={16} />
      <h2 id="search-title" className="text-sm font-semibold">
        {children}
      </h2>
    </div>
  );
}

/** Pro without Search Console: what it shows, and one button (docs/SPEC.md section 28.2). */
export function SearchConnect({ connect }: { connect: (formData: FormData) => Promise<void> }) {
  return (
    <Frame dashed>
      <Title>See the Google searches that bring people here</Title>
      <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
        Connect Google Search Console (read-only) to see the searches where you&apos;re close to
        page 1, what changed search by search, your name against other searches, and the pages
        people see in Google but don&apos;t click.
      </p>
      <form action={connect}>
        <GoogleButton>Connect Search Console</GoogleButton>
      </form>
    </Frame>
  );
}

/** Free: Google search insights are part of Pro. */
export function SearchTeaser({ href }: { href: string }) {
  return (
    <Frame dashed className="sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-1 gap-3">
        <SearchIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 id="search-title" className="text-sm font-semibold">
            See what really brings your customers
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {plans.pro.name} shows where the people behind your signups and sales first found you,
            which Google searches lead to signups, one page to work on each week, and revenue from
            Stripe next to your visitors.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="h-9 shrink-0 gap-1.5 pointer-coarse:h-11">
        <Link href={href as Route}>
          <SparklesIcon aria-hidden="true" />
          See {plans.pro.name}
        </Link>
      </Button>
    </Frame>
  );
}

const PROBLEMS: Record<SearchProblem, { title: string; text: string }> = {
  revoked: {
    title: "Google access ended.",
    text: "Reconnect Google at the top of the page to see your searches again.",
  },
  scope: {
    title: "SimpleDash can't read Search Console any more.",
    text: "The read-only access was removed or not ticked on Google's screen. Allow it again to see your searches.",
  },
  no_access: {
    title: "This Google account can't open that Search Console property any more.",
    text: "Pick another property in Settings, or ask its owner to add your Google account in Search Console.",
  },
  quota: {
    title: "Google's Search Console limit was reached for now.",
    text: "Try again in a few minutes.",
  },
  unavailable: {
    title: "Search Console isn't answering right now.",
    text: "We'll try again in a moment. Refresh the page in a few minutes.",
  },
  bad_request: {
    title: "Search Console didn't accept the request.",
    text: "We've been told about it. Try another date range, or come back later.",
  },
};

/** Nothing to show: Search Console couldn't be asked, in plain words with one action. */
export function SearchProblemCard({
  problem,
  connect,
  settingsHref,
}: {
  problem: SearchProblem;
  connect: (formData: FormData) => Promise<void>;
  settingsHref: string;
}) {
  const { title, text } = PROBLEMS[problem];
  return (
    <Frame>
      <Title />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-pretty text-muted-foreground">{text}</p>
      </div>
      {problem === "scope" ? (
        <form action={connect}>
          <GoogleButton>Allow Search Console access</GoogleButton>
        </form>
      ) : problem === "no_access" ? (
        <Button asChild variant="outline" className="h-9 self-start pointer-coarse:h-11">
          <Link href={settingsHref as Route}>Pick a property</Link>
        </Button>
      ) : null}
    </Frame>
  );
}

/** A note above the numbers when they're older than they should be. */
export function searchProblemNote(problem: SearchProblem | null): string | null {
  return problem ? `${PROBLEMS[problem].title} These are the last numbers we had.` : null;
}

/** The card's shape while it loads, so nothing moves when the numbers arrive. */
export function SearchSkeleton() {
  return (
    <Frame>
      <Title />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b pb-3 @2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-full max-w-xl rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </Frame>
  );
}
