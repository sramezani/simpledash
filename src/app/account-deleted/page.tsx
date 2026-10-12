import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account deleted",
  robots: { index: false, follow: false },
};

/** Where "Delete account" ends (docs/SPEC.md section 6). */
export default function AccountDeletedPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center py-12">
      <Container className="flex max-w-md flex-col gap-6">
        <Link href="/" aria-label="SimpleDash home" className="self-start rounded-md">
          <Logo />
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your account and data were deleted.
          </h1>
          <p className="text-pretty text-muted-foreground">
            We cancelled any subscription and removed SimpleDash&apos;s access to your Google
            account. Stripe keeps its own payment records for tax law. Thanks for trying SimpleDash.
          </p>
        </div>
        <Button asChild variant="outline" className="self-start">
          <Link href="/">Back to the home page</Link>
        </Button>
      </Container>
    </main>
  );
}
