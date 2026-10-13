import { CardShell } from "@/components/shared/card-shell";
import { cardById } from "@/config/cards";
import type { LiveData } from "@/lib/ga4/live";
import { LiveSkeleton, LiveView } from "./live-view";

/** The "Right now" card: live count, places, pages and the globe. */
export function LiveCard({
  data,
  endpoint,
  loading,
  deferred,
}: {
  data: LiveData | null;
  endpoint: string | null;
  loading?: boolean;
  /** Fetch the numbers in the browser (the public page is cached, so it can't carry them). */
  deferred?: boolean;
}) {
  const card = cardById.live;
  return (
    <CardShell id="live" title={card.title} help={card.help} hideTitle>
      {loading ? (
        <LiveSkeleton />
      ) : data || (deferred && endpoint) ? (
        <LiveView initial={data} endpoint={endpoint} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Live numbers aren&apos;t available right now.
        </p>
      )}
    </CardShell>
  );
}
