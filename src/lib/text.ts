/** Text helpers for searching lists. Pure, so they are tested. */

/** Accents and case don't matter when searching: "sao" finds "São Paulo". */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** True when every word of the query appears in one of the texts (accents and case ignored). */
export function matchesSearch(query: string, ...texts: (string | null | undefined)[]): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fold(texts.filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}
