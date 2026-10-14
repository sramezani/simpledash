import Link from "next/link";
import { CookieSettingsButton } from "@/components/shared/consent";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { brand } from "@/config/theme";

/** Footer for the landing and legal pages. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{brand.tagline}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <CookieSettingsButton className="text-muted-foreground hover:text-foreground" />
          <a
            href={`mailto:${brand.supportEmail}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {brand.supportEmail}
          </a>
        </nav>
      </Container>
    </footer>
  );
}
