import type { Route } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { GitHubIcon, XIcon } from "@/components/shared/brand-icons";
import { CookieSettingsButton } from "@/components/shared/consent";
import { plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { getFooterStats } from "@/lib/public-page/footer";
import type { FooterStats } from "@/lib/public-page/footer-data";
import { reportError } from "@/lib/report-error";
import { cn } from "@/lib/utils";
import { StartButton } from "./account-link";
import { FooterBand } from "./footer-band";
import { FOOTER_FRAME, FooterWord } from "./footer-word";

const linkClass = "rounded-sm text-footer-muted transition-colors hover:text-footer-foreground";

/** A frosted pill on the band, for the GitHub and X links. */
const pillClass =
  "inline-flex h-9 items-center gap-2 rounded-full border border-footer-foreground/25 bg-footer-foreground/10 px-3.5 text-sm font-medium text-footer-foreground backdrop-blur-md transition-colors hover:bg-footer-foreground/20";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/#pricing" },
      { label: "Live demo", href: "/demo" },
      { label: "Compare", href: "/compare" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Guides", href: "/guides" },
      { label: "GA4 glossary", href: "/glossary" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/**
 * Footer for the landing and legal pages (docs/SPEC.md section 17): a brand-coloured band with a last
 * call and the links, SimpleDash's own live numbers, and the name as a chart of its last days.
 * The numbers stream in after the static page; until then (or without them) the band and the
 * word hold their place, so nothing moves.
 */
export function SiteFooter({
  preview,
}: {
  /** Dev previews (/ui-kit/footer): these numbers instead of the real ones. */
  preview?: FooterStats | null;
} = {}) {
  return (
    <footer
      id="footer"
      className="footer-glow overflow-hidden bg-footer text-footer-foreground [&_:focus-visible]:outline-footer-accent"
    >
      <div
        className={cn(
          FOOTER_FRAME,
          "grid gap-12 pt-16 pb-14 sm:pt-24 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20",
        )}
      >
        <div className="flex flex-col items-start gap-4">
          <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {brand.tagline}
          </h2>
          <p className="text-footer-muted signed-in:hidden">
            {plans.free.name} for all your sites · no card · read-only access
          </p>
          <div className="mt-3">
            <StartButton label="See my dashboard, free" variant="light" />
          </div>
        </div>
        <div className="flex flex-col gap-10">
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-12 gap-y-10 text-sm sm:grid-cols-3"
          >
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <h3 className="font-medium text-footer-foreground">{column.title}</h3>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {link.href.includes("#") ? (
                        // A plain link, like the top bar's Pricing (see SiteHeader).
                        <a href={link.href} className={linkClass}>
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href as Route} className={linkClass}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                  {column.title === "Company" ? (
                    <>
                      <li>
                        <CookieSettingsButton className={linkClass} />
                      </li>
                      <li>
                        <a href={`mailto:${brand.supportEmail}`} className={linkClass}>
                          {brand.supportEmail}
                        </a>
                      </li>
                    </>
                  ) : null}
                </ul>
              </div>
            ))}
          </nav>
          <div className="flex flex-wrap gap-3">
            <a
              href={brand.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={pillClass}
            >
              <GitHubIcon className="size-4" />
              Open source on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              href={brand.makerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={pillClass}
            >
              <XIcon className="size-3.5" />
              Made by {brand.makerName}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
      {preview === undefined ? (
        <Suspense fallback={<FooterNumbersView stats={null} />}>
          <FooterNumbers />
        </Suspense>
      ) : (
        <FooterNumbersView stats={preview} />
      )}
    </footer>
  );
}

async function FooterNumbers() {
  await connection(); // the numbers are cached, and must not be fetched during the build
  let stats: FooterStats | null = null;
  try {
    stats = await getFooterStats();
  } catch (error) {
    reportError("Footer numbers failed", error);
  }
  return <FooterNumbersView stats={stats} />;
}

function FooterNumbersView({ stats }: { stats: FooterStats | null }) {
  return (
    <>
      <FooterBand
        items={stats?.ticker ?? []}
        checkedAt={stats?.checkedAt ?? null}
        label={stats?.label ?? ""}
      />
      <FooterWord stats={stats} />
    </>
  );
}
