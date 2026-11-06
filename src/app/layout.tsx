import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ConsentBanner } from "@/components/shared/consent";
import { brand, colors } from "@/config/theme";
import { signedInHintScript } from "@/lib/auth/signed-in-hint";
import { env } from "@/lib/env";
import { fontVariables } from "@/lib/theme/fonts";
import { themeScript } from "@/components/shared/theme-pref";
import { ThemeStyle } from "@/lib/theme/theme-style";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: `${brand.name}: ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  openGraph: { type: "website", siteName: brand.name, locale: "en_GB" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: colors.light.background },
    { media: "(prefers-color-scheme: dark)", color: colors.dark.background },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline scripts below may add data-signed-in, data-theme and the dark class before React loads.
    <html
      lang="en"
      className={fontVariables}
      // Smooth scrolling for same-page links (Pricing); Next.js turns it off while changing pages.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <ThemeStyle />
        {/* A plain inline script, so it runs before the first paint and a picked theme never
            flashes the other one (Next's beforeInteractive scripts are queued until later). */}
        <script id="theme-choice" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script id="signed-in-hint" strategy="beforeInteractive">
          {signedInHintScript}
        </Script>
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
