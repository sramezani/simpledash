import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { AccountLink } from "./account-link";

/** Top bar for the landing and legal pages. */
export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <Container className="flex h-14 items-center gap-4">
        <Link href="/" aria-label="SimpleDash home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href={"/guides" as Route}
            className="hidden h-9 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex pointer-coarse:h-11"
          >
            Guides
          </Link>
          <Link
            href={"/docs" as Route}
            className="hidden h-9 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex pointer-coarse:h-11"
          >
            Docs
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground pointer-coarse:h-11"
          >
            Pricing
          </Link>
          <AccountLink />
        </nav>
      </Container>
    </header>
  );
}
