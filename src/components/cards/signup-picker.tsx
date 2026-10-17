import { EmptyState } from "@/components/shared/empty-state";
import { SignupPickerForm, type SignupPickState } from "./signup-picker-form";

type SignupPickerProps = {
  /** The property's key events, or null when Google couldn't be asked. */
  keyEvents: string[] | null;
  current: string | null;
  /** Server action that saves the chosen event. */
  action: (state: SignupPickState, formData: FormData) => Promise<SignupPickState>;
};

/** Our guide to marking a key event in GA4 (docs/SPEC.md section 30). */
const HOW_TO = "/guides/ga4-key-events";

/**
 * "Which action means a signup?" (docs/SPEC.md section 11.2). A picker of the
 * property's key events, or a short how-to when there are none.
 */
export function SignupPicker({ keyEvents, current, action }: SignupPickerProps) {
  if (keyEvents === null) {
    return (
      <EmptyState title="Which action means a signup?">
        We couldn&apos;t load your key events from Google right now. Try again in a moment.
      </EmptyState>
    );
  }
  if (keyEvents.length === 0) {
    return (
      <EmptyState title="Which action means a signup?">
        <p>
          In Google Analytics, go to Admin → Events and mark your signup event as a key event. Then
          reload this page and pick it here.{" "}
          <a href={HOW_TO} className="font-medium text-primary underline-offset-2 hover:underline">
            How to mark a key event
          </a>
        </p>
      </EmptyState>
    );
  }
  return <SignupPickerForm keyEvents={keyEvents} current={current} action={action} />;
}
