import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { LogoMark } from "@/components/shared/logo";
import { SegmentedLinks } from "@/components/shared/segmented-links";
import { RANGE_LABELS, RANGE_TYPES, type RangeType } from "@/lib/ga4/ranges";

type TopBarProps = {
  range: RangeType;
  /** The site switcher, or a "Sample data" badge. */
  site: ReactNode;
  /** Where the date switch links to (the dev preview uses its own page). */
  basePath?: "/dashboard" | "/ui-kit/dashboard";
  showSettings?: boolean;
};

/** Logo, site switcher, date switch and settings (docs/SPEC.md section 11). */
export function TopBar({ range, site, basePath = "/dashboard", showSettings = true }: TopBarProps) {
  return (
    <header className="border-b bg-background">
      <Container className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
        <Link href={basePath} aria-label="SimpleDash dashboard" className="shrink-0 rounded-md">
          <LogoMark className="size-7 text-brand" />
        </Link>
        <div className="min-w-0 flex-1">{site}</div>
        <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">
          <SegmentedLinks
            label="Date range"
            className="w-full justify-between sm:w-auto"
            items={RANGE_TYPES.map((r) => ({
              label: RANGE_LABELS[r],
              href: { pathname: basePath, query: r === "7d" ? {} : { range: r } },
              active: r === range,
            }))}
          />
        </div>
        {showSettings ? (
          <Link
            href="/settings"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground pointer-coarse:size-11"
          >
            <SettingsIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">Settings</span>
          </Link>
        ) : null}
      </Container>
    </header>
  );
}
