import { SettingsIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";

type TopBarProps = {
  /** Where the logo links to (the dev preview uses its own page). */
  basePath?: "/dashboard" | "/ui-kit/dashboard";
  showSettings?: boolean;
  /** Settings for the site shown: "/settings/sites/<id>". */
  settingsHref?: Route;
};

/** Logo and settings (docs/SPEC.md section 11). The site and date range sit above the overview. */
export function TopBar({
  basePath = "/dashboard",
  showSettings = true,
  settingsHref = "/settings",
}: TopBarProps) {
  return (
    <header className="border-b bg-background">
      <Container className="flex h-14 items-center gap-3">
        <Link href={basePath} aria-label="SimpleDash dashboard" className="shrink-0 rounded-md">
          <Logo />
        </Link>
        {showSettings ? (
          <Link
            href={settingsHref}
            className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground pointer-coarse:h-11"
          >
            <SettingsIcon className="size-4" aria-hidden="true" />
            Settings
          </Link>
        ) : null}
      </Container>
    </header>
  );
}
