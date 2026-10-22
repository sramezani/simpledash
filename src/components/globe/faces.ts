import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";
import { avatarBackgrounds } from "@/config/theme";

/**
 * Drawn faces for the live globe, one per visitor in a place, made in the browser
 * (DiceBear's Notionists by Zoish, CC0). Only decoration: GA4 tells us how many people
 * are in a city, never who they are. A place keeps the same faces from one update to the next.
 */
const cache = new Map<string, string>();
const backgrounds = avatarBackgrounds.map((hex) => hex.replace("#", ""));

export function faceFor(seed: string): string {
  let uri = cache.get(seed);
  if (!uri) {
    uri = createAvatar(notionists, { seed, backgroundColor: backgrounds, radius: 50 }).toDataUri();
    cache.set(seed, uri);
  }
  return uri;
}
