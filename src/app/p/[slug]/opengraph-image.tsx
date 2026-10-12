import { ImageResponse } from "next/og";
import { LogoTile } from "@/components/shared/logo";
import { brand, colors } from "@/config/theme";
import { getPublicView } from "@/lib/public-page/view";

export const alt = "Live stats";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A public page's social image: the domain and "Live stats", drawn from the theme. */
export default async function PublicOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getPublicView(slug, "7d");
  const label = view.kind === "missing" ? brand.name : view.label;
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
      <span style={{ fontSize: 34, color: c["muted-foreground"] }}>Live stats</span>
      <span style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <LogoTile size={48} />
        <span style={{ fontSize: 30 }}>Powered by {brand.name}</span>
      </div>
    </div>,
    size,
  );
}
