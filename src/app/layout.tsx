import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ConsentBanner } from "@/components/shared/consent";
import { brand, colors } from "@/config/theme";
import { signedInHintScript } from "@/lib/auth/signed-in-hint";
import { env } from "@/lib/env";
import { fontVariables } from "@/lib/theme/fonts";
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
  themeColor: colors.light.background,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script below may add data-signed-in before React loads.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeStyle />
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
