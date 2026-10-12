import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "Every Monday we'll email you last week's numbers." Shown until dismissed (docs/SPEC.md section 12). */
export function EmailNotice({
  turnOff,
  dismiss,
}: {
  turnOff: (formData: FormData) => Promise<void>;
  dismiss: () => Promise<void>;
}) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card px-4 py-3 text-sm"
    >
      <MailIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="flex-1">Every Monday we&apos;ll email you last week&apos;s numbers.</p>
      <div className="flex gap-1">
        <form action={turnOff}>
          <Button type="submit" variant="ghost" className="h-8 pointer-coarse:h-11">
            Turn off
          </Button>
        </form>
        <form action={dismiss}>
          <Button type="submit" variant="outline" className="h-8 pointer-coarse:h-11">
            Got it
          </Button>
        </form>
      </div>
    </div>
  );
}
