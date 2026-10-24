"use client";

import {
  FileTextIcon,
  MapPinIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
} from "lucide-react";
import { Tabs } from "radix-ui";
import { useState } from "react";
import { actionRows } from "@/components/cards/actions-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Flag } from "@/components/shared/flag";
import { RankedList, type RankedRow } from "@/components/shared/ranked-list";
import { TechIcon } from "@/components/shared/tech-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { deviceIcons } from "@/config/tech-icons";
import { formatNumber } from "@/lib/format";
import type { LiveData, LivePlace } from "@/lib/ga4/live";
import { cn } from "@/lib/utils";
import { LiveDot } from "./live-button";

type LivePanelProps = {
  data: LiveData | null;
  failed: boolean;
  siteName: string;
  signupEvent: string | null;
  onSelectPlace: (place: LivePlace) => void;
  className?: string;
};

const ROWS = 7;
const placeKey = (p: LivePlace) => `${p.lat},${p.lng}`;

/** The live view's numbers: the count, visitors per minute, and what they're doing. */
export function LivePanel({
  data,
  failed,
  siteName,
  signupEvent,
  onSelectPlace,
  className,
}: LivePanelProps) {
  return (
    <section
      aria-label="Live numbers"
      className={cn(
        "relative z-10 flex flex-col overflow-y-auto bg-card text-card-foreground shadow-lg ring-1 ring-foreground/5",
        className,
      )}
    >
      {data ? (
        <Loaded
          data={data}
          siteName={siteName}
          signupEvent={signupEvent}
          onSelectPlace={onSelectPlace}
        />
      ) : failed ? (
        <div className="p-5">
          <EmptyState title="Live numbers aren't available right now.">
            Google Analytics didn&apos;t answer. We&apos;ll keep trying every 20 seconds.
          </EmptyState>
        </div>
      ) : (
        <PanelSkeleton />
      )}
    </section>
  );
}

function Loaded({
  data,
  siteName,
  signupEvent,
  onSelectPlace,
}: Omit<LivePanelProps, "data" | "failed" | "className"> & { data: LiveData }) {
  // GA4 sends no row for an event nobody triggered, so a missing count here is a real zero.
  const pageViews = data.events.page_view ?? 0;
  const signups = signupEvent ? (data.events[signupEvent] ?? 0) : null;
  const byKey = new Map(data.places.map((p) => [placeKey(p), p]));

  return (
    <>
      <header className="flex flex-col gap-4 p-5 pb-4">
        <p className="truncate pr-10 text-sm text-muted-foreground md:pr-0" title={siteName}>
          {siteName}
        </p>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <p className="flex flex-col gap-0.5" aria-live="polite">
            <span className="flex items-center gap-2.5 text-4xl font-semibold tracking-tight tabular-nums">
              <LiveDot active={data.total > 0} className="size-2.5 [&>span]:size-2.5" />
              {formatNumber(data.total)}
            </span>
            <span className="text-sm text-muted-foreground">
              {data.total === 1 ? "visitor" : "visitors"} in the last {data.minutes} minutes
            </span>
          </p>
          <dl className="flex gap-5 pb-0.5 text-sm">
            <Stat label="Page views" value={pageViews} />
            {signups !== null ? <Stat label="Signups" value={signups} /> : null}
          </dl>
        </div>
        <MinuteBars perMinute={data.perMinute} />
      </header>

      <Tabs.Root defaultValue="places" className="flex flex-col gap-2 px-3 pb-3">
        <Tabs.List
          aria-label="Live details"
          className="mx-2 grid grid-cols-4 gap-0.5 rounded-lg bg-muted p-0.5"
        >
          {(
            [
              ["places", "Places"],
              ["pages", "Pages"],
              ["devices", "Devices"],
              ["actions", "Actions"],
            ] as const
          ).map(([value, label]) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="h-8 rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs pointer-coarse:h-10"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Panel value="places">
          <RankedList
            itemLabel="Place"
            columns={["Visitors"]}
            initial={ROWS}
            onSelect={(key) => {
              const place = byKey.get(key);
              if (place) onSelectPlace(place);
            }}
            rows={data.places.map((p) => ({
              key: placeKey(p),
              label: p.label,
              values: [p.visitors],
              icon: <Flag code={p.countryCode} />,
            }))}
            empty={<Quiet icon={MapPinIcon} title="Nobody on the site right now." />}
          />
        </Panel>
        <Panel value="pages">
          <RankedList
            itemLabel="Page"
            columns={["Visitors"]}
            initial={ROWS}
            rows={data.pages.map((p) => ({ key: p.title, label: p.title, values: [p.visitors] }))}
            empty={<Quiet icon={FileTextIcon} title="No pages open right now." />}
          />
        </Panel>
        <Panel value="devices">
          <RankedList
            itemLabel="Device"
            columns={["Visitors"]}
            initial={ROWS}
            rows={data.devices.map((d) => ({
              key: d.device,
              label: d.label,
              values: [d.visitors],
              icon: <TechIcon name={deviceIcons[d.device]} />,
            }))}
            empty={<Quiet icon={MonitorSmartphoneIcon} title="No devices right now." />}
          />
        </Panel>
        <Panel value="actions">
          <RankedList
            itemLabel="Action"
            columns={["Count"]}
            initial={ROWS}
            rows={actionRows(data.events, signupEvent).map((row): RankedRow => ({
              key: row.key,
              label: row.label,
              values: [row.value],
              icon: <row.icon className="size-3.5 text-muted-foreground" aria-hidden="true" />,
            }))}
            empty={
              <Quiet icon={MousePointerClickIcon} title="No actions in the last few minutes.">
                Downloads, outbound clicks, form submits and signups show up here.
              </Quiet>
            }
          />
        </Panel>
      </Tabs.Root>

      <footer className="mt-auto flex flex-col gap-1 border-t px-5 py-3 text-xs text-pretty text-muted-foreground">
        <p>Faces are for fun: visitors stay anonymous.</p>
        <p>
          Places:{" "}
          <a
            href="https://www.geonames.org/"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            GeoNames
          </a>{" "}
          (CC BY 4.0). Map: Natural Earth.
        </p>
      </footer>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{formatNumber(value)}</dd>
    </div>
  );
}

function Panel({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Content value={value} className="@container rounded-lg outline-none">
      {children}
    </Tabs.Content>
  );
}

function Quiet({
  icon,
  title,
  children,
}: {
  icon: typeof MapPinIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <EmptyState icon={icon} title={title} className="px-2">
      {children}
    </EmptyState>
  );
}

/**
 * Visitors in each minute of the window, newest on the right. Hovering a bar says how many
 * and when; the line under the bars says the same in words for everyone else.
 */
function MinuteBars({ perMinute }: { perMinute: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...perMinute);
  const last = perMinute.length - 1;
  const busiest = perMinute.lastIndexOf(Math.max(...perMinute));
  const ago = (i: number) => last - i;
  const when = (i: number) => (ago(i) === 0 ? "this minute" : `${ago(i)} min ago`);
  const summary =
    max > 0 && perMinute[busiest]! > 0
      ? `Busiest minute: ${formatNumber(perMinute[busiest]!)} ${perMinute[busiest] === 1 ? "visitor" : "visitors"}, ${when(busiest)}.`
      : "No visits in this window yet.";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Visitors per minute</span>
        <span className="tabular-nums" aria-hidden="true">
          {hover !== null
            ? `${formatNumber(perMinute[hover] ?? 0)} · ${when(hover)}`
            : `${perMinute.length} min`}
        </span>
      </div>
      <div
        className="flex h-14 items-end gap-0.5"
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Visitors per minute over the last ${perMinute.length} minutes. ${summary}`}
      >
        {perMinute.map((value, i) => (
          <span
            key={i}
            onPointerEnter={() => setHover(i)}
            className="flex h-full flex-1 items-end"
            aria-hidden="true"
          >
            <span
              style={{ height: value > 0 ? `${Math.max((value / max) * 100, 8)}%` : "2px" }}
              className={cn(
                "w-full rounded-[3px] transition-[height,background-color] duration-500 ease-out",
                value === 0
                  ? "bg-muted"
                  : i === last
                    ? "bg-chart-1"
                    : hover === i
                      ? "bg-chart-1/80"
                      : "bg-chart-1/45",
              )}
            />
          </span>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{perMinute.length} min ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5" aria-busy="true">
      <span className="sr-only">Loading live visitors…</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
