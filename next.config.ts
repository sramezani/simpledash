import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

// Basic security headers (docs/SPEC.md section 19). HSTS is set at Cloudflare.
// A full CSP with script nonces would make the static pages dynamic, so it waits.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

// Public pages, the landing page and the legal pages are cached at Cloudflare for 10 minutes
// (docs/SPEC.md sections 15 and 17).
const publicCache = {
  key: "Cache-Control",
  value: "public, s-maxage=600, stale-while-revalidate=86400",
};

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  poweredByHeader: false,
  turbopack: { root: import.meta.dirname },
  serverExternalPackages: [
    "@google-analytics/data",
    "@google-analytics/admin",
    "google-auth-library",
  ],
  // Every docs, guides, glossary and compare page has a Markdown copy for AI assistants at its
  // address plus ".md" (docs/SPEC.md section 30).
  async rewrites() {
    return ["docs", "guides", "glossary", "compare"].flatMap((section) => [
      { source: `/${section}.md`, destination: `/llms.mdx/${section}/content.md` },
      { source: `/${section}/:slug*.md`, destination: `/llms.mdx/${section}/:slug*/content.md` },
    ]);
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/p/:slug", headers: [publicCache] },
      // The landing and legal pages stream in the footer's numbers (docs/SPEC.md section 17).
      { source: "/", headers: [publicCache] },
      { source: "/privacy", headers: [publicCache] },
      { source: "/terms", headers: [publicCache] },
      // The live demo is shown in a frame on our own landing page, and only there.
      // A later rule wins for the same header, so this replaces the two above.
      {
        source: "/demo",
        headers: [
          publicCache,
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

// Content collections are defined with Fumadocs MDX's Macro API (src/lib/content/source.ts).
// Only modules that import "fumadocs-mdx/macro" are transformed.
const withMDX = createMDX();

export default withMDX(nextConfig);
