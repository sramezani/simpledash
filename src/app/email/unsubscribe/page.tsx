import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { unsubscribeAction } from "@/app/actions/email";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/** One button turns the Monday email off (docs/SPEC.md section 14). No sign-in needed. */
export default function UnsubscribePage({ searchParams }: PageProps<"/email/unsubscribe">) {
  return (
    <main id="main" className="flex min-h-dvh items-center py-12">
      <Container className="flex max-w-md flex-col gap-6">
        <Link href="/" aria-label="SimpleDash home" className="self-start rounded-md">
          <Logo />
        </Link>
        <Suspense fallback={null}>
          <Content searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/email/unsubscribe">, "searchParams">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  if (one(params.done)) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re unsubscribed</h1>
        <p className="text-muted-foreground">
          You won&apos;t get the Monday email any more. You can turn it back on in{" "}
          <Link href="/settings" className="underline underline-offset-2">
            Settings
          </Link>
          .
        </p>
      </div>
    );
  }
  const token = one(params.token);
  if (one(params.error) || !token) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">This link doesn&apos;t work</h1>
        <p className="text-muted-foreground">
          Turn the Monday email off in{" "}
          <Link href="/settings" className="underline underline-offset-2">
            Settings
          </Link>{" "}
          instead.
        </p>
      </div>
    );
  }
  return (
    <form action={unsubscribeAction} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Stop the Monday email?</h1>
      <p className="text-muted-foreground">
        You&apos;ll stop getting last week&apos;s numbers by email. Your dashboard stays the same.
      </p>
      <input type="hidden" name="token" value={token} />
      <Button type="submit" size="lg" className="self-start">
        Turn off the Monday email
      </Button>
    </form>
  );
}
