import { ImageResponse } from "next/og";
import { LogoTile } from "@/components/shared/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home-screen icon on Apple devices: the dash mark, drawn from the theme file. */
export default function AppleIcon() {
  return new ImageResponse(<LogoTile size={180} rounded={false} />, size);
}
