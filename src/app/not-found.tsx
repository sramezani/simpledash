import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center py-16">
      <Container className="flex flex-col items-start gap-4">
        <Link href="/" aria-label="SimpleDash home">
          <Logo />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">This page doesn&apos;t exist, or it was turned off.</p>
        <Button asChild size="lg">
          <Link href="/">Go to the home page</Link>
        </Button>
      </Container>
    </main>
  );
}
