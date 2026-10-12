/**
 * The chart and the notes panel are separate client components; they talk through
 * two window events, so neither has to know about the other.
 */
export const PICK_DAY = "simpledash:pick-day";
export const EDIT_NOTE = "simpledash:edit-note";

export const pickDay = (key: string) =>
  window.dispatchEvent(new CustomEvent(PICK_DAY, { detail: key }));
export const editNote = (id: string) =>
  window.dispatchEvent(new CustomEvent(EDIT_NOTE, { detail: id }));
