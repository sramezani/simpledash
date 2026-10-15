"use client";

import { CreditCardIcon, MailIcon, UserRoundIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { SiteIcon } from "@/components/shared/site-icon";
import type { SettingsNavGroup, SettingsNavItem } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

const ICONS = { profile: UserRoundIcon, billing: CreditCardIcon, email: MailIcon } as const;

/**
 * The settings menu (docs/SPEC.md section 5): a column of groups beside the page from
 * tablet width, a row that scrolls sideways on phones. The page shown is marked from the
 * address (`activeHref` instead, for the dev preview).
 */
export function SettingsNav({
  groups,
  activeHref,
}: {
  groups: SettingsNavGroup[];
  activeHref?: string;
}) {
  const pathname = usePathname();
  const active = activeHref ?? pathname;
  const navRef = useRef<HTMLElement>(null);
  const activeLink = useRef<HTMLAnchorElement>(null);

  // On phones the row may start with the page shown out of sight. Only the row scrolls:
  // the page itself stays put (it may have just jumped to a #section).
  useEffect(() => {
    const nav = navRef.current;
    const link = activeLink.current;
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const row = nav.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.left < row.left || item.right > row.right) {
      nav.scrollLeft += item.left - row.left - 16;
    }
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="Settings"
      className="-mx-4 -my-1.5 flex [scrollbar-width:none] gap-4 overflow-x-auto px-4 py-1.5 md:m-0 md:flex-col md:gap-6 md:overflow-visible md:p-0"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex shrink-0 gap-1 md:flex-col md:gap-0.5">
          <p className="hidden px-2.5 pb-1.5 text-xs font-medium text-muted-foreground md:block">
            {group.label}
          </p>
          {group.items.map((item) => {
            const current = item.href === active;
            return (
              <Link
                key={item.href}
                ref={current ? activeLink : undefined}
                href={item.href as Route}
                aria-current={current ? "page" : undefined}
                title={item.icon === "site" ? item.label : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap transition-colors duration-150 ease-out md:px-2.5 pointer-coarse:h-11",
                  "border md:border-transparent",
                  current
                    ? "border-transparent bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <NavIcon item={item} />
                <span className="min-w-0 truncate md:flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function NavIcon({ item }: { item: SettingsNavItem }) {
  if (item.icon === "site") return <SiteIcon domain={item.domain ?? null} />;
  const Icon = ICONS[item.icon];
  return <Icon className="size-4 shrink-0" aria-hidden="true" />;
}

/** The menu's shape while the account's sites load. */
export function SettingsNavSkeleton() {
  return (
    <div className="flex gap-2 md:flex-col" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-lg bg-muted/70 md:w-full" />
      ))}
    </div>
  );
}
