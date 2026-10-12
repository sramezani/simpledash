import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Href = ComponentProps<typeof Link>["href"];

type SegmentedLinksProps = {
  label: string;
  items: { label: string; href: Href; active: boolean }[];
  className?: string;
};

/**
 * A segmented control made of links, so it works without JavaScript
 * (the date switch: `?range=`). The current one has aria-current.
 */
export function SegmentedLinks({ label, items, className }: SegmentedLinksProps) {
  return (
    <nav
      aria-label={label}
      className={cn("inline-flex rounded-lg border bg-muted p-0.5", className)}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          scroll={false}
          prefetch={false}
          className={cn(
            "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out pointer-coarse:h-11",
            item.active
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
