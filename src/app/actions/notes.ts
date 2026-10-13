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

/**
 * Chart notes. Each action is bound to a site ID on the page; `requireSite` checks the
 * site is the user's own and open on their plan before anything changes.
 */

/** Adds a chart note to one of the user's own sites. */
export async function addNoteAction(
  siteId: string,
  _state: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const { site } = await requireSite(siteId);
  const input = readNote(formData);
  if (!input.ok) return { error: input.error };
  await addNote(site.id, input.note);
  refresh();
  return { saved: true };
}

/** Edits a note, only if it belongs to that site. */
export async function updateNoteAction(
  siteId: string,
  _state: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const { site } = await requireSite(siteId);
  const id = idOf(formData);
  const input = readNote(formData);
  if (!id) return { error: "That note doesn't exist." };
  if (!input.ok) return { error: input.error };
  if (!(await updateNote(site.id, id, input.note))) return { error: "That note doesn't exist." };
  refresh();
  return { saved: true };
}

/** Deletes a note, only if it belongs to that site. */
export async function deleteNoteAction(
  siteId: string,
  _state: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const { site } = await requireSite(siteId);
  const id = idOf(formData);
  if (!id || !(await deleteNote(site.id, id))) return { error: "That note doesn't exist." };
  refresh();
  return { saved: true };
}
