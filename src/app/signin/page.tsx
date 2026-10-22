import { CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/shared/container";
import { GoogleButton } from "@/components/shared/google-button";
import { Logo } from "@/components/shared/logo";
import { Notice } from "@/components/shared/notice";
import { signInWithGoogle } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with Google to see your Google Analytics on one simple page.",
  robots: { index: false, follow: true },
};

const promises = [
  "Read-only access to Google Analytics. We can't change anything.",
  "No tracking code to add. We use the data Google already has.",
  "14 days free. No card needed.",
];

/** One screen saying what we read, then "Continue with Google" (docs/SPEC.md section 5). */
export default function SignInPage({ searchParams }: PageProps<"/signin">) {
  return (
    <main id="main" className="flex min-h-dvh items-center py-12">
      <Container className="flex max-w-md flex-col gap-8">
        <Link href="/" aria-label="SimpleDash home" className="self-start rounded-md">
          <Logo />
        </Link>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">See your dashboard</h1>
          <p className="text-pretty text-muted-foreground">
            Continue with the Google account that has your Google Analytics. We&apos;ll find your
            site and show your numbers in seconds.
          </p>
        </div>
        <Suspense fallback={null}>
          <SignInError searchParams={searchParams} />
        </Suspense>
        <ul className="flex flex-col gap-3">
          {promises.map((text) => (
            <li key={text} className="flex gap-3 text-sm">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        <form action={signInWithGoogle}>
          <GoogleButton className="w-full">Continue with Google</GoogleButton>
        </form>
        <p className="text-xs text-pretty text-muted-foreground">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            privacy policy
          </Link>
          .
        </p>
      </Container>
    </main>
  );
}

async function SignInError({ searchParams }: Pick<PageProps<"/signin">, "searchParams">) {
  const { error, disconnected, expired } = await searchParams;
  if (disconnected === "1") {
    return (
      <Notice title="Google is disconnected">
        SimpleDash can&apos;t read your Google Analytics any more, and you&apos;re signed out. Your
        settings are kept: continue with Google to pick up where you left off.
      </Notice>
    );
  }
  if (expired === "1" && !error) {
    return (
      <Notice title="You're signed out">
        Your sign-in has ended. Continue with Google to see your dashboard again.
      </Notice>
    );
  }
  if (!error) return null;
  const cancelled = error === "access_denied";
  return (
    <Notice tone="warning" title={cancelled ? "Sign-in was cancelled" : "Sign-in didn't finish"}>
      {cancelled
        ? "You closed Google's screen before allowing access. Try again when you're ready."
        : "Something went wrong on the way back from Google. Please try again."}
    </Notice>
  );
}
