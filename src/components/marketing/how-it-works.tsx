import { LayoutDashboardIcon, LogInIcon, SearchIcon } from "lucide-react";
import { Container } from "@/components/shared/container";

const steps = [
  {
    icon: LogInIcon,
    title: "Sign in with Google",
    body: "One screen. We ask for read-only access to Google Analytics, nothing else.",
  },
  {
    icon: SearchIcon,
    title: "We find your GA4 site",
    body: "No setup. If you have several sites, we pick the busiest one. Switch any time.",
  },
  {
    icon: LayoutDashboardIcon,
    title: "See it on one page",
    body: "Your visitors, sources and top pages, in plain words. Plus a short email every Monday.",
  },
];

const reasons = [
  ["Zero setup", "If GA4 is already on your site, it works in one click. No new tracking code."],
  [
    "Full history from day one",
    "Google already stores it, so your charts go back years, not days.",
  ],
  ["A flat price", "No traffic limits and no per-event pricing, because we store almost nothing."],
];

/** How it works, in 3 steps, and why SimpleDash. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-16 sm:py-20">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-8">
          <h2 id="how-title" className="text-center text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <step.icon className="size-4" aria-hidden="true" />
                  Step {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {reasons.map(([title, body]) => (
            <li key={title} className="flex flex-col gap-1.5">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
