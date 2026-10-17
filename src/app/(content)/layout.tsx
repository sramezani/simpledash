import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { brand } from "@/config/theme";
import { menuTree } from "@/lib/content/source";

/**
 * Docs, guides, glossary and comparisons (docs/SPEC.md section 30): the section tabs and
 * the menu on the left, the page in the middle, "On this page" on the right. Light only.
 */
export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{ enabled: false }}
      search={{
        // The search dialog's code loads when it's first opened, not with every page.
        preload: false,
        links: [
          ["Docs", "/docs"],
          ["Guides", "/guides"],
          ["Glossary", "/glossary"],
          ["Compare", "/compare"],
        ],
      }}
    >
      <div className="flex min-h-dvh flex-col">
        <DocsLayout
          tree={menuTree()}
          nav={{ title: <Logo />, url: "/" }}
          githubUrl={brand.sourceUrl}
          themeSwitch={{ enabled: false }}
          links={[
            { text: "Pricing", url: "/#pricing", active: "none" },
            {
              type: "button",
              url: "/dashboard",
              text: (
                <>
                  <span className="signed-in:hidden">Start free</span>
                  <span className="hidden signed-in:inline">Dashboard</span>
                </>
              ),
            },
          ]}
        >
          {children}
        </DocsLayout>
      </div>
    </RootProvider>
  );
}
