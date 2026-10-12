import { ImageResponse } from "next/og";
import { LogoTile } from "@/components/shared/logo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** The favicon: the dash mark, drawn from the theme file. */
export default function Icon() {
  return new ImageResponse(<LogoTile size={32} />, size);
}
