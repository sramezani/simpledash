import { Notice } from "@/components/shared/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RESULTS: Record<string, { tone: "info" | "warning"; title: string } | undefined> = {
  saved: { tone: "info", title: "Saved. Sales by source now count this." },
  google: {
    tone: "warning",
    title: "Couldn't check your key events with Google. Please try again.",
  },
  not_key_event: { tone: "warning", title: "That isn't a key event in Google Analytics any more." },
  bad_page: { tone: "warning", title: "A page starts with / and has no spaces, like /thank-you." },
};

const field =
  "h-9 min-w-0 rounded-lg border border-input bg-background px-3 text-sm transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 pointer-coarse:h-11";

/**
 * Settings → "What counts as a sale?" (docs/SPEC.md section 28.3): a GA4 key event, a
 * "thank you" page, or nothing. A plain form, so it needs no JavaScript.
 */
export function SaleSettings({
  saleEvent,
  salePage,
  keyEvents,
  result,
  action,
}: {
  saleEvent: string | null;
  salePage: string | null;
  /** The property's key events, or null when Google couldn't be asked. */
  keyEvents: string[] | null;
  result: string | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const notice = result ? RESULTS[result] : undefined;
  const kind = saleEvent ? "event" : salePage ? "page" : "none";
  return (
    <form action={action} className="flex flex-col gap-3">
      {notice ? <Notice tone={notice.tone} title={notice.title} /> : null}
      <p className="text-sm text-pretty text-muted-foreground">
        Sales by source counts this in Google Analytics, next to visitors and signups. Exact counts
        from GA4, per source and landing page.
      </p>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="sr-only">What counts as a sale?</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="radio"
            name="kind"
            value="none"
            defaultChecked={kind === "none"}
            className="size-4 accent-primary"
          />
          Nothing yet
        </label>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="kind"
              value="event"
              defaultChecked={kind === "event"}
              className="size-4 accent-primary"
            />
            A key event
          </label>
          {keyEvents && keyEvents.length > 0 ? (
            <select
              name="event"
              aria-label="Sale key event"
              defaultValue={
                saleEvent ?? (keyEvents.includes("purchase") ? "purchase" : keyEvents[0])
              }
              className={field}
            >
              {keyEvents.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground">
              {keyEvents === null
                ? "Couldn't load your key events right now."
                : "No key events yet: mark one in GA4 (Admin → Events)."}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="kind"
              value="page"
              defaultChecked={kind === "page"}
              className="size-4 accent-primary"
            />
            Views of a page
          </label>
          <Input
            name="page"
            aria-label="Thank-you page path"
            defaultValue={salePage ?? ""}
            placeholder="/thank-you"
            autoComplete="off"
            spellCheck={false}
            className={`${field} w-56 font-mono`}
          />
        </div>
      </fieldset>
      <Button type="submit" variant="outline" className="h-9 self-start pointer-coarse:h-11">
        Save
      </Button>
    </form>
  );
}
