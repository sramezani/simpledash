"use server";

import { refresh } from "next/cache";
import { requireSite } from "@/lib/auth/session";
import { addNote, deleteNote, updateNote } from "@/lib/notes/notes";
import { readNote } from "@/lib/notes/validate";

export type NoteState = { error?: string; saved?: boolean } | null;

const idOf = (formData: FormData) => {
  const id = formData.get("id");
  return typeof id === "string" && /^[0-9a-f-]{36}$/.test(id) ? id : null;
};

/** Adds a chart note to the user's own active site. */
export async function addNoteAction(_state: NoteState, formData: FormData): Promise<NoteState> {
  const { site } = await requireSite();
  const input = readNote(formData);
  if (!input.ok) return { error: input.error };
  await addNote(site.id, input.note);
  refresh();
  return { saved: true };
}

/** Edits a note, only if it belongs to the user's own active site. */
export async function updateNoteAction(_state: NoteState, formData: FormData): Promise<NoteState> {
  const { site } = await requireSite();
  const id = idOf(formData);
  const input = readNote(formData);
  if (!id) return { error: "That note doesn't exist." };
  if (!input.ok) return { error: input.error };
  if (!(await updateNote(site.id, id, input.note))) return { error: "That note doesn't exist." };
  refresh();
  return { saved: true };
}

/** Deletes a note, only if it belongs to the user's own active site. */
export async function deleteNoteAction(_state: NoteState, formData: FormData): Promise<NoteState> {
  const { site } = await requireSite();
  const id = idOf(formData);
  if (!id || !(await deleteNote(site.id, id))) return { error: "That note doesn't exist." };
  refresh();
  return { saved: true };
}
