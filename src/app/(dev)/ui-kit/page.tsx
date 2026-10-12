import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { Container } from "@/components/shared/container";
import { Delta } from "@/components/shared/delta";
import { EmptyState } from "@/components/shared/empty-state";
import { Flag } from "@/components/shared/flag";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Notice } from "@/components/shared/notice";
import { PopoverButton } from "@/components/shared/popover-button";
import { RankedList } from "@/components/shared/ranked-list";
import { RangePicker } from "@/components/shared/range-picker";
import { SegmentedRadio } from "@/components/shared/segmented-radio";
import { SiteChip } from "@/components/shared/site-chip";
import { SiteIcon } from "@/components/shared/site-icon";
import { ViewToggle } from "@/components/shared/view-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { brand, colors, radius, shadows, type ColorToken } from "@/config/theme";
import { uiKitEnabled } from "@/lib/env";
import { rangeMenu } from "@/lib/ga4/ranges";

export const metadata: Metadata = { title: "UI kit", robots: { index: false, follow: false } };

/**
 * Every theme token and shared block on one page (docs/SPEC.md sections 4 and 18).
 * Development only: it is a 404 in production.
 */
export default function UiKitPage() {
  if (!uiKitEnabled) notFound();

  const tokens = Object.entries(colors.light) as [ColorToken, string][];

  return (
    <main id="main" className="py-10">
      <Container className="flex flex-col gap-12">
        <header className="flex flex-col gap-2">
          <Logo />
          <h1 className="text-3xl font-semibold tracking-tight">UI kit</h1>
          <p className="text-muted-foreground">
            Every token from <code className="font-mono text-sm">src/config/theme.ts</code> and
            every shared block. Check theme changes and new blocks here.
          </p>
        </header>

        <Section title="Brand">
          <dl className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
            {Object.entries(brand).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-6">
            <Logo />
            <LogoMark className="size-10 text-brand" />
            <LogoMark className="size-6 text-foreground" />
          </div>
        </Section>

        <Section title="Colour tokens">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tokens.map(([token, value]) => (
              <li key={token} className="flex flex-col gap-1.5">
                <span
                  className="h-14 rounded-lg border"
                  style={{ background: `var(--${token})` }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">{token}</span>
                <span className="font-mono text-xs text-muted-foreground">{value}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Radius and shadows">
          <p className="text-sm text-muted-foreground">Base radius: {radius}</p>
          <div className="flex flex-wrap gap-4">
            {(["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"] as const).map((r) => (
              <div
                key={r}
                className={`flex size-20 items-center justify-center border bg-card text-xs ${r}`}
              >
                {r}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(shadows) as (keyof typeof shadows)[]).map((s) => (
              <div
                key={s}
                className={`flex size-20 items-center justify-center rounded-lg bg-card text-xs ${shadowClass[s]}`}
              >
                shadow-{s}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <p className="text-4xl font-semibold tracking-tight">Google Analytics, in a dash.</p>
          <p className="text-2xl font-semibold tracking-tight">
            Visitors up 23% vs the previous 7 days
          </p>
          <p className="text-base">Body text in Geist. Sentence case everywhere.</p>
          <p className="text-sm text-muted-foreground">Quiet text: help and hints.</p>
          <p className="text-3xl font-semibold tabular-nums">1,234 · 56,789 · 1m 23s</p>
          <p className="flex gap-4 text-sm">
            <span className="text-positive">▲ 23% up</span>
            <span className="text-negative">▼ 12% down</span>
            <span className="text-warning">Still updating</span>
          </p>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Coming soon</Badge>
            <Badge variant="outline">Sample data</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Section title="Card, form and states">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Flat card with a 1 px edge.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Label htmlFor="ui-kit-slug">Page address</Label>
                <Input id="ui-kit-slug" placeholder="mysite-com" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loading</CardTitle>
                <CardDescription>Skeletons have the final size.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          <Separator />
        </Section>

        <Section title="Shared blocks">
          <p className="text-sm text-muted-foreground">
            The dashboard in every state, on sample data:{" "}
            <Link
              href="/ui-kit/dashboard"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              /ui-kit/dashboard
            </Link>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <CardShell id="kit-stat" title="CardShell + Delta" help="The ⓘ is a native popover.">
              <p className="text-3xl font-semibold tracking-tight tabular-nums">1,234</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <Delta change={23} versus="vs the previous 7 days" size="compact" />
                <Delta change={-12} versus="vs the previous 7 days" size="compact" />
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <Delta change={-12} versus="vs the previous 7 days" />
                <Delta change={0} versus="vs the previous 7 days" />
                <Delta change={null} versus="vs the previous 7 days" />
              </div>
            </CardShell>
            <CardShell id="kit-dimmed" title="Dimmed (cached, can't refresh)" dimmed>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">1m 23s</p>
              <Delta change={4} versus="vs the previous 7 days" size="compact" />
            </CardShell>
            <CardShell id="kit-ranked" title="RankedList (Flag, SiteIcon)">
              <RankedList
                id="kit-ranked"
                itemLabel="Country"
                columns={["Visitors", "Share"]}
                initial={3}
                rows={[
                  ["US", "United States", 340],
                  ["DE", "Germany", 100],
                  ["GB", "United Kingdom", 90],
                  ["NL", "Netherlands", 50],
                ].map(([code, name, visitors]) => ({
                  key: String(code),
                  label: String(name),
                  values: [Number(visitors), Number(visitors)],
                  display: [null, `${Math.round((Number(visitors) / 580) * 100)}%`],
                  icon: <Flag code={String(code)} />,
                }))}
              />
              <div className="mt-3 flex gap-3">
                <SiteIcon domain="github.com" />
                <SiteIcon domain={null} />
                <SiteIcon domain={null} direct />
              </div>
            </CardShell>
            <CardShell id="kit-toggle" title="ViewToggle + EmptyState">
              <ViewToggle
                name="kit-view"
                label="Pick a view"
                views={[
                  {
                    value: "a",
                    label: "First",
                    content: <p className="text-sm">The first view.</p>,
                  },
                  {
                    value: "b",
                    label: "Second",
                    content: <EmptyState title="No visitors in this period." />,
                  },
                ]}
              />
            </CardShell>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <SiteChip domain="github.com" label="github.com" />
            <RangePicker value="7d" options={rangeMenu("/ui-kit")} />
            <SegmentedRadio
              name="kit-interval"
              label="Billing"
              options={[
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly" },
              ]}
            />
            <SegmentedRadio
              name="kit-three"
              label="Three options"
              options={[
                { value: "a", label: "Sources" },
                { value: "b", label: "Channels" },
                { value: "c", label: "Campaigns" },
              ]}
            />
            <PopoverButton
              id="kit-popover"
              panel="A PopoverButton opens a small panel. No JavaScript."
              className="h-9 rounded-lg border px-3 text-sm hover:bg-muted"
            >
              Open a popover
            </PopoverButton>
          </div>
          <div className="flex flex-col gap-3">
            <Notice title="Info notice">One action at most.</Notice>
            <Notice
              tone="warning"
              title="Warning notice"
              action={<Button variant="outline">Action</Button>}
            >
              For states such as the quota.
            </Notice>
            <Notice tone="danger" title="Danger notice" />
          </div>
        </Section>
      </Container>
    </main>
  );
}

// Full class names, so Tailwind finds them.
const shadowClass: Record<keyof typeof shadows, string> = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
