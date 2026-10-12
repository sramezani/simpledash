import type { SVGProps } from "react";
import { brand, colors } from "@/config/theme";
import { cn } from "@/lib/utils";

type LogoMarkProps = SVGProps<SVGSVGElement> & {
  /** The dash colour. Defaults to the text colour, so `className="text-brand"` sets it. */
  color?: string;
};

/** The "–" dash mark. Also drawn into the favicons and Open Graph images. */
export function LogoMark({ color = "currentColor", ...props }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" {...props}>
      <rect x="5" y="12.5" width="22" height="7" rx="3.5" fill={color} />
    </svg>
  );
}

/** The SimpleDash logo: the dash mark and the name, always one word. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <LogoMark className="size-6 text-brand" />
      {brand.name}
    </span>
  );
}

/**
 * The dash on a brand-coloured tile, drawn with inline styles from the theme file.
 * Used where CSS classes don't exist: favicons and Open Graph images (next/og).
 * Apple icons pass `rounded={false}`: iOS rounds them itself and turns transparent corners black.
 */
export function LogoTile({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.light.brand,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <LogoMark color={colors.light["primary-foreground"]} width={size * 0.9} height={size * 0.9} />
    </div>
  );
}
