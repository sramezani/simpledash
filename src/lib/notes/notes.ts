import "server-only";
import { and, asc, between, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { chartNote } from "@/lib/db/schema";
import type { NoteInput } from "./validate";

/** Chart notes for one site. Every write is scoped to the site, so a note ID alone changes nothing. */

export type Note = { id: string; day: string; text: string };

export function listNotes(siteId: string, start: string, end: string): Promise<Note[]> {
  return db
    .select({ id: chartNote.id, day: chartNote.day, text: chartNote.text })
    .from(chartNote)
    .where(and(eq(chartNote.siteId, siteId), between(chartNote.day, start, end)))
    .orderBy(asc(chartNote.day));
}

export async function addNote(siteId: string, note: NoteInput) {
  await db.insert(chartNote).values({ id: crypto.randomUUID(), siteId, ...note });
}

export async function updateNote(siteId: string, id: string, note: NoteInput): Promise<boolean> {
  const rows = await db
    .update(chartNote)
    .set(note)
    .where(and(eq(chartNote.id, id), eq(chartNote.siteId, siteId)))
    .returning({ id: chartNote.id });
  return rows.length > 0;
}

export async function deleteNote(siteId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(chartNote)
    .where(and(eq(chartNote.id, id), eq(chartNote.siteId, siteId)))
    .returning({ id: chartNote.id });
  return rows.length > 0;
}
