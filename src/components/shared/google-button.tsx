import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A submit button with Google's "G", for forms whose action starts Google sign-in.
 * A plain form post, so it works without JavaScript.
 */
export function GoogleButton({ children, className }: { children: string; className?: string }) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-3 rounded-lg border border-input bg-card px-5 text-sm font-medium text-foreground shadow-xs transition-colors duration-150 ease-out hover:bg-muted active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <Image src="/google-g.svg" alt="" width={18} height={18} />
      {children}
    </button>
  );
}
