import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { TopBar } from "./top-bar";

/**
 * A site in the list that the plan doesn't open now (added on Growth, back on
 * Starter: docs/SPEC.md section 28.1). Nothing is deleted: the upgrade panel, with a
 * way to make this site the one Starter shows instead (`OpenInsteadForm`).
 */
export function PausedSiteView({
  switcher,
  label,
  children,
}: {
  /** The site menu. */
  switcher: ReactNode;
  label: string;
  /** The upgrade panel. */
  children: ReactNode;
}) {
  return (
    <>
      <TopBar />
      <main id="main" className="pb-16">
        <Container className="flex flex-col gap-4 pt-5">
          <h1 className="sr-only">{label}</h1>
          <div className="flex flex-wrap items-center gap-2">{switcher}</div>
          {children}
        </Container>
      </main>
    </>
  );
}

/** "Show mysite.com instead": Starter shows this listed site in place of the current one. */
export function OpenInsteadForm({
  label,
  siteId,
  action,
}: {
  label: string;
  siteId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex flex-col items-start gap-2 pt-2">
      <input type="hidden" name="site" value={siteId} />
      <p className="text-sm text-pretty text-muted-foreground">
        {label} is paused: Starter shows one site at a time. Its notes and settings are kept.
      </p>
      <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
        Show {label} instead
      </Button>
    </form>
  );
}
