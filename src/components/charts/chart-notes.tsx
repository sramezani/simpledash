"use client";

import { PlusIcon } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format";
import { EDIT_NOTE, PICK_DAY } from "./chart-events";

type Note = { id: string; day: string; text: string };
type NoteState = { error?: string; saved?: boolean } | null;
type NoteAction = (state: NoteState, formData: FormData) => Promise<NoteState>;

type ChartNotesProps = {
  notes: Note[];
  /** First and last day a note can be on (the chart's range). */
  min: string;
  max: string;
  add: NoteAction;
  update: NoteAction;
  remove: NoteAction;
};

/** "YYYYMMDD" or "YYYYMM" → "YYYY-MM-DD" (the 1st for a month). */
const keyToDay = (key: string) =>
  `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8) || "01"}`;

/**
 * Chart notes (docs/SPEC.md section 13): "+ Add note", and the notes in this range
 * with Edit and Delete. Picking a day on the chart, or a note's marker, opens the form.
 */
export function ChartNotes({ notes, min, max, add, update, remove }: ChartNotesProps) {
  const addPanel = useRef<HTMLDivElement>(null);
  const [addDay, setAddDay] = useState(max);
  const [editing, setEditing] = useState<Note | null>(null);
  const editPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPick = (e: Event) => {
      const day = keyToDay((e as CustomEvent<string>).detail);
      setAddDay(day < min ? min : day > max ? max : day);
      addPanel.current?.showPopover();
    };
    const onEdit = (e: Event) => {
      const note = notes.find((n) => n.id === (e as CustomEvent<string>).detail);
      if (note) setEditing(note);
    };
    window.addEventListener(PICK_DAY, onPick);
    window.addEventListener(EDIT_NOTE, onEdit);
    return () => {
      window.removeEventListener(PICK_DAY, onPick);
      window.removeEventListener(EDIT_NOTE, onEdit);
    };
  }, [notes, min, max]);

  useEffect(() => {
    if (editing) editPanel.current?.showPopover();
  }, [editing]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={() => {
            setAddDay(max);
            addPanel.current?.showPopover();
          }}
        >
          <PlusIcon aria-hidden="true" />
          Add note
        </Button>
        {notes.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setEditing(note)}
                  className="rounded-sm text-muted-foreground hover:text-foreground"
                >
                  <span className="font-medium text-foreground">{formatDay(note.day)}</span> ·{" "}
                  {note.text}
                  <span className="sr-only"> (edit)</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div ref={addPanel} popover="auto" className="note-panel">
        <NoteForm
          key={addDay}
          title="Add a note"
          action={add}
          min={min}
          max={max}
          day={addDay}
          text=""
        />
      </div>
      <div
        ref={editPanel}
        popover="auto"
        className="note-panel"
        onToggle={(e) => {
          if ((e as unknown as ToggleEvent).newState === "closed") setEditing(null);
        }}
      >
        {editing ? (
          <NoteForm
            key={editing.id}
            title="Edit note"
            action={update}
            min={min}
            max={max}
            day={editing.day}
            text={editing.text}
            id={editing.id}
            remove={remove}
          />
        ) : null}
      </div>
    </div>
  );
}

type NoteFormProps = {
  title: string;
  action: NoteAction;
  min: string;
  max: string;
  day: string;
  text: string;
  id?: string;
  remove?: NoteAction;
};

function NoteForm({ title, action, min, max, day, text, id, remove }: NoteFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const [removeState, removeAction, removing] = useActionState(remove ?? action, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.saved || removeState?.saved) {
      form.current?.closest<HTMLElement>("[popover]")?.hidePopover();
      if (!id) form.current?.reset();
    }
  }, [state, removeState, id]);

  const error = state?.error ?? removeState?.error;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{title}</p>
      <form ref={form} action={formAction} className="flex flex-col gap-3">
        {id ? <input type="hidden" name="id" value={id} /> : null}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Day
          <input
            type="date"
            name="day"
            required
            min={min}
            max={max}
            defaultValue={day}
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Note
          <input
            type="text"
            name="text"
            required
            maxLength={80}
            defaultValue={text}
            placeholder="Launched on Product Hunt"
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground"
          />
        </label>
        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" className="h-9" disabled={pending || removing}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {id && remove ? (
            <Button
              type="submit"
              variant="destructive"
              className="h-9"
              formAction={removeAction}
              disabled={pending || removing}
            >
              {removing ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
