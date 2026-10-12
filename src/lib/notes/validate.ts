import { z } from "zod";

/** Chart note input (docs/SPEC.md section 13): a day and up to 80 characters. Pure, so it is tested. */
export const noteInput = z.object({
  day: z.iso.date("Pick a day."),
  text: z
    .string()
    .transform((t) => t.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1, "Write a short note.").max(80, "Keep it under 80 characters.")),
});

export type NoteInput = z.infer<typeof noteInput>;

/** Reads a note from a form. Returns the input, or the first problem in plain words. */
export function readNote(
  formData: FormData,
): { ok: true; note: NoteInput } | { ok: false; error: string } {
  const parsed = noteInput.safeParse({
    day: formData.get("day"),
    text: formData.get("text") ?? "",
  });
  if (parsed.success) return { ok: true, note: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the note." };
}
