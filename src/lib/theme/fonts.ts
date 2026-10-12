import { Geist } from "next/font/google";

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

export const fontVariables = fontSans.variable;
