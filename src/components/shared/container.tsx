import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Centres page content with the standard width and side padding. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}
