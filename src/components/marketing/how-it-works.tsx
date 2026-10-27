import {
  CheckIcon,
  ChartNoAxesColumnIcon,
  GlobeIcon,
  HistoryIcon,
  LockIcon,
  PlugZapIcon,
  TagIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { LogoMark } from "@/components/shared/logo";
import { FREE_HISTORY_DAYS, plans } from "@/config/plans";
import { SAMPLE_DOMAIN } from "@/lib/ga4/sample/sample";
import { cn } from "@/lib/utils";

const steps: { title: string; body: string; visual: ReactNode }[] = [
  {
    title: "Sign in with Google",
    body: "One screen. We ask for read-only access to Google Analytics, nothing else.",
    visual: <SignInVisual />,
  },
  {
    title: "We find your GA4 site",
    body: "No setup. If you have several sites, we pick the busiest one. Switch any time.",
    visual: <FindSiteVisual />,
  },
  {
    title: "See it on one page",
    body: `Your visitors, sources and top pages, in plain words. On ${plans.pro.name}, a short email every Monday too.`,
    visual: <OnePageVisual />,
  },
];

const reasons = [
  {
    icon: PlugZapIcon,
    title: "Zero setup",
    body: "If GA4 is already on your site, it works in one click. No new tracking code.",
  },
  {
    icon: HistoryIcon,
    title: "Full charts from day one",
    body: `Google already stores your visits, so nothing starts empty: the last ${FREE_HISTORY_DAYS} days on ${plans.free.name}, years on ${plans.pro.name}.`,
  },
  {
    icon: TagIcon,
    title: "A flat price",
    body: "No traffic limits and no per-event pricing, because we store almost nothing.",
  },
];

/**
 * How it works (docs/SPEC.md section 17): the roadmap's 3 steps, each with a small drawing of
 * that step made of plain HTML (no images to load), then why SimpleDash. The drawings show
 * shapes and labels, never made-up numbers.
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="how-glow scroll-mt-4 py-20 sm:py-28"
    >
      <Container className="flex flex-col gap-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            How it works
          </p>
          <h2
            id="how-title"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
          >
            Three steps to your numbers
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            No tracking code and nothing to set up. If Google Analytics is on your site, your
            dashboard is ready when you sign in.
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-5 rounded-2xl border bg-card p-2.5 pb-6"
            >
              <div
                aria-hidden="true"
                className="relative flex h-52 items-center justify-center overflow-hidden rounded-xl bg-linear-to-b from-primary/10 via-primary/5 to-card"
              >
                <div className="how-dots absolute inset-0" />
                {step.visual}
              </div>
              <div className="flex flex-col gap-2 px-3.5">
                <span className="font-mono text-xs font-medium text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <ul className="grid divide-y rounded-2xl border bg-card md:grid-cols-3 md:divide-x md:divide-y-0">
          {reasons.map((reason) => (
            <li key={reason.title} className="flex gap-4 p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <reason.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold">{reason.title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">{reason.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** A small floating window inside a step's drawing. */
function Window({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative rounded-xl border bg-card p-3 shadow-md", className)}>
      {children}
    </div>
  );
}

/** Step 1: Google's consent screen, reduced to what we ask for. */
function SignInVisual() {
  return (
    <Window className="w-60">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand">
          <LogoMark className="size-5 text-primary-foreground" />
        </span>
        <span className="text-xs text-muted-foreground">SimpleDash wants to</span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs font-medium">
        <ChartNoAxesColumnIcon className="size-3.5 text-primary" />
        See your Google Analytics
      </div>
      <div className="mt-2 flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground">
        <LockIcon className="size-3" />
        Read-only access
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium">
        <span className="flex h-7 items-center justify-center rounded-md border">Cancel</span>
        <span className="flex h-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          Allow
        </span>
      </div>
    </Window>
  );
}

/** Step 2: the sites in the Google account, the busiest one picked. */
function FindSiteVisual() {
  const sites = [
    { name: SAMPLE_DOMAIN, share: 100, picked: true },
    { name: `blog.${SAMPLE_DOMAIN}`, share: 38, picked: false },
    { name: `shop.${SAMPLE_DOMAIN}`, share: 16, picked: false },
  ];
  return (
    <Window className="w-64 p-1.5">
      <ul className="flex flex-col gap-0.5">
        {sites.map((site) => (
          <li
            key={site.name}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-2",
              site.picked && "bg-primary/10 ring-1 ring-primary/25",
            )}
          >
            <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{site.name}</span>
            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  "block h-full rounded-full",
                  site.picked ? "bg-primary" : "bg-primary/30",
                )}
                style={{ width: `${site.share}%` }}
              />
            </span>
            <CheckIcon className={cn("size-3.5 text-primary", !site.picked && "invisible")} />
          </li>
        ))}
      </ul>
      <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
        Busiest picked · switch any time
      </p>
    </Window>
  );
}

/** Step 3: one page with the visitors line and the top sources. */
function OnePageVisual() {
  const sources = [
    { name: "Google", share: 100 },
    { name: "Direct", share: 58 },
    { name: "x.com", share: 34 },
  ];
  return (
    <Window className="w-64">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-1.5 rounded-full bg-chart-1" />
          Visitors
        </span>
        <span className="text-muted-foreground">Last 30 days</span>
      </div>
      <svg viewBox="0 0 220 64" className="how-line mt-2 h-14 w-full" preserveAspectRatio="none">
        <path
          d="M0 50 C 18 46, 26 52, 42 44 S 70 30, 86 36 S 112 40, 128 28 S 156 14, 172 22 S 200 10, 220 8 L 220 64 L 0 64 Z"
          className="fill-chart-1/15"
        />
        <path
          d="M0 50 C 18 46, 26 52, 42 44 S 70 30, 86 36 S 112 40, 128 28 S 156 14, 172 22 S 200 10, 220 8"
          fill="none"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="stroke-chart-1"
        />
      </svg>
      <ul className="mt-2 flex flex-col gap-1.5 border-t pt-2.5">
        {sources.map((source) => (
          <li key={source.name} className="flex items-center gap-2 text-xs">
            <span className="w-12 text-muted-foreground">{source.name}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-chart-1/60"
                style={{ width: `${source.share}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Window>
  );
}
