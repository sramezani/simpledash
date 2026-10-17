import { ImageResponse } from "next/og";
import { LogoTile } from "@/components/shared/logo";
import { brand, colors } from "@/config/theme";
import type { ContentPage, ContentSection } from "@/lib/content/source";

export const ogSize = { width: 1200, height: 630 };

const SECTION_LABELS: Record<ContentSection, string> = {
  docs: "Docs",
  guides: "Guide",
  glossary: "GA4 in plain words",
  compare: "Compare",
};

/** A content page's social image (docs/SPEC.md section 30), in the landing page's style. */
export function contentOgImage(page: ContentPage) {
  const c = colors.light;
  const section = page.slugs[0] as ContentSection;
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
        <LogoTile size={64} />
        <span style={{ fontSize: 40, fontWeight: 600 }}>{brand.name}</span>
        <span style={{ fontSize: 30, color: c["muted-foreground"], marginLeft: 12 }}>
          {SECTION_LABELS[section]}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2, lineHeight: 1.08 }}>
          {page.data.title}
        </span>
        <span
          style={{ fontSize: 30, color: c["muted-foreground"], lineHeight: 1.35, maxWidth: 1000 }}
        >
          {page.data.description}
        </span>
      </div>
      <div
        style={{ display: "flex", height: 10, width: 220, borderRadius: 5, background: c.brand }}
      />
    </div>,
    ogSize,
  );
}
