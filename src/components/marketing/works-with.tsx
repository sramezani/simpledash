import {
  ChartNoAxesColumnIcon,
  CreditCardIcon,
  EyeOffIcon,
  LockIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { GitHubIcon } from "@/components/shared/brand-icons";
import { Container } from "@/components/shared/container";

/**
 * What SimpleDash reads from, and why it can be trusted (docs/SPEC.md section 17). Names in
 * text with our own plain icons: these are integrations, not customers, and Google's logos
 * aren't ours to use. Every fact here is true and checkable.
 */
// Each icon takes a soft nod to that tool's own colour, from the theme: amber, blue, violet.
const tools = [
  { icon: ChartNoAxesColumnIcon, name: "Google Analytics 4", tone: "text-chart-3" },
  { icon: SearchIcon, name: "Google Search Console", tone: "text-chart-1" },
  { icon: CreditCardIcon, name: "Stripe", tone: "text-primary" },
];

const facts = [
  // Google approved the app's read-only data access (OAuth verification, Oct 2026).
  { icon: ShieldCheckIcon, text: "Verified by Google", strong: true },
  { icon: LockIcon, text: "Read-only access" },
  { icon: EyeOffIcon, text: "No tracking script" },
  { icon: GitHubIcon, text: "Open source" },
];

export function WorksWith() {
  return (
    <section
      id="works-with"
      aria-labelledby="works-with-title"
      className="scroll-mt-4 py-12 sm:py-16"
    >
      <Container className="flex flex-col items-center gap-7">
        <h2 id="works-with-title" className="text-sm font-medium text-muted-foreground">
          Works with the tools you already use
        </h2>
        <ul className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-14 sm:gap-y-4">
          {tools.map((tool) => (
            <li
              key={tool.name}
              className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground/75 sm:text-xl"
            >
              <tool.icon className={`size-5 ${tool.tone}`} aria-hidden="true" />
              {tool.name}
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap justify-center gap-2">
          {facts.map((fact) => (
            <li
              key={fact.text}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-sm text-muted-foreground"
            >
              <fact.icon
                className={fact.strong ? "size-4 text-positive" : "size-3.5"}
                aria-hidden="true"
              />
              <span className={fact.strong ? "font-medium text-foreground" : undefined}>
                {fact.text}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
