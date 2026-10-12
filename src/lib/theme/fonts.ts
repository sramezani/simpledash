import { Caveat, Geist } from "next/font/google";

/**
 * Fonts are the one part of the look outside the theme file: Next.js needs
 * `next/font` calls in their own module. Change the font here.
 *
 * `display: "optional"`: the size-matched fallback shows at once and Geist is used
 * when it arrives in time (always on a repeat visit), so text never jumps and the
 * largest paint isn't held back by the font. Code uses the system monospace font.
 */
export const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "optional",
});

/**
 * The handwritten notes on the landing page ("Interactive demo", "2 months free").
 * Not preloaded: they are small, placed absolutely (so a late font moves nothing)
 * and sit below the first screen.
 */
export const fontHand = Caveat({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const fontVariables = `${fontSans.variable} ${fontHand.variable}`;
