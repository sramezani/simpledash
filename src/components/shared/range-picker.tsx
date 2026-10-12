"use client";

import { CalendarIcon, ChevronDownIcon, LoaderCircleIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Fragment, useOptimistic, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { chipButtonClass } from "./site-chip";

export type RangeOption = {
  value: string;
  label: string;
  href: string;
  /** Draw a line above this option (between single days and longer periods). */
  separated?: boolean;
};

/**
 * The date range menu above the overview ("Last 7 days ⌄"). Each option is a page
 * address (`?range=`), so the server renders the new range. The label changes at
 * once and a small spinner shows while the new numbers load.
 */
export function RangePicker({ value, options }: { value: string; options: RangeOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);
  const current = options.find((o) => o.value === shown) ?? options[0];

  function choose(next: string) {
    const option = options.find((o) => o.value === next);
    if (!option || next === shown) return;
    startTransition(() => {
      setShown(next);
      router.push(option.href as Route, { scroll: false });
    });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={cn(chipButtonClass, "group/range")}>
        <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        <span>
          <span className="sr-only">Date range: </span>
          {current?.label}
        </span>
        {pending ? (
          <LoaderCircleIcon
            className="size-4 animate-spin text-muted-foreground"
            aria-label="Loading"
          />
        ) : (
          <ChevronDownIcon
            className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]/range:rotate-180"
            aria-hidden="true"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-48 p-1.5 duration-150">
        <DropdownMenuRadioGroup value={shown} onValueChange={choose}>
          {options.map((option) => (
            <Fragment key={option.value}>
              {option.separated ? <DropdownMenuSeparator /> : null}
              <DropdownMenuRadioItem
                value={option.value}
                className="h-9 cursor-pointer rounded-md px-2.5 transition-colors duration-100 data-[state=checked]:font-medium pointer-coarse:h-11"
              >
                {option.label}
              </DropdownMenuRadioItem>
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
