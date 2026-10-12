import { ImageResponse } from "next/og";
import { LogoTile } from "@/components/shared/logo";
import { brand, colors } from "@/config/theme";

export const alt = `${brand.name}: ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The landing page's social image, drawn from the theme file (docs/SPEC.md section 17). */
export default function OpenGraphImage() {
  const c = colors.light;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: c.background,
        color: c.foreground,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <LogoTile size={72} />
        <span style={{ fontSize: 44, fontWeight: 600 }}>{brand.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
          {brand.tagline}
        </span>
        <span
          style={{ fontSize: 32, color: c["muted-foreground"], lineHeight: 1.35, maxWidth: 980 }}
        >
          Your visitors, sources and top pages on one page. No setup, no new tracking code.
        </span>
      </div>
      <div
        style={{ display: "flex", height: 10, width: 220, borderRadius: 5, background: c.brand }}
      />
    </div>,
    size,
  );
}
