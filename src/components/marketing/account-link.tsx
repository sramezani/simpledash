import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * "Sign in", or "Dashboard" when this browser is signed in. Both are in the static
 * page and CSS shows one (the `signed-in:` variant, set before the first paint),
 * so the landing page stays cacheable and nothing moves.
 */
export function AccountLink() {
  return (
    <>
      <Button asChild variant="outline" className="h-9 px-3 signed-in:hidden">
        <Link href="/signin">Sign in</Link>
      </Button>
      <Button asChild className="hidden h-9 gap-1.5 px-3 signed-in:inline-flex">
        <Link href="/dashboard">
          Dashboard
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </>
  );
}

/** The hero's main button: start, or go back to the dashboard when signed in. */
export function HeroCta({ startLabel }: { startLabel: string }) {
  return (
    <>
      <Button asChild size="lg" className="h-12 px-6 text-base signed-in:hidden">
        <Link href="/signin">{startLabel}</Link>
      </Button>
      <Button asChild size="lg" className="hidden h-12 gap-2 px-6 text-base signed-in:inline-flex">
        <Link href="/dashboard">
          Open my dashboard
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </>
  );
}
