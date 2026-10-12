import { Container } from "@/components/shared/container";
import { HeroCta } from "./account-link";
import { brand } from "@/config/theme";
import { plans } from "@/config/plans";

/** The headline and button, exactly as in the roadmap. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="pt-14 pb-10 sm:pt-20">
      <Container className="flex flex-col items-center gap-6 text-center">
        <p className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          Works with the Google Analytics 4 you already have
        </p>
        <h1
          id="hero-title"
          className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          {brand.tagline}
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{brand.description}</p>
        <div className="flex flex-col items-center gap-2">
          <HeroCta startLabel="See my dashboard, free" />
          <p className="text-xs text-muted-foreground signed-in:hidden">
            {plans.starter.trialDays} days free · no card · read-only access
          </p>
        </div>
      </Container>
    </section>
  );
}
