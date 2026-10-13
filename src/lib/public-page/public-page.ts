import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { defaultPublicCardIds, publicCardIds, type CardId } from "@/config/cards";
import { db } from "@/lib/db/client";
import { publicPage, type PublicPage, type Site } from "@/lib/db/schema";
import { slugCandidates, slugFromDomain, slugProblem } from "./slug";

/** A site's public page settings, or undefined when it was never turned on. */
export function getSitePublicPage(siteId: string): Promise<PublicPage | undefined> {
  return db.query.publicPage.findFirst({ where: eq(publicPage.siteId, siteId) });
}

/** The dashboard card's one-click "Turn on": a slug from the domain and the default cards. */
export async function turnOnPublicPage(owned: Site): Promise<PublicPage> {
  const existing = await getSitePublicPage(owned.id);
  if (existing) {
    const [row] = await db
      .update(publicPage)
      .set({ enabled: true })
      .where(eq(publicPage.siteId, owned.id))
      .returning();
    return row!;
  }
  const base = slugFromDomain(owned.domain ?? owned.displayName);
  const values = {
    siteId: owned.id,
    userId: owned.userId,
    enabled: true,
    cards: [...defaultPublicCardIds],
    indexable: true,
  };
  for (const slug of slugCandidates(base)) {
    const [row] = await db
      .insert(publicPage)
      .values({ ...values, slug })
      .onConflictDoNothing()
      .returning();
    if (row) return row;
    // Nothing inserted: the slug is taken, or a second click already made this site's page.
    const mine = await getSitePublicPage(owned.id);
    if (mine) return mine;
  }
  // Very unlikely: every numbered candidate is taken.
  const [row] = await db
    .insert(publicPage)
    .values({ ...values, slug: `${base.slice(0, 30)}-${crypto.randomUUID().slice(0, 8)}` })
    .returning();
  return row!;
}

export type PublicPageInput = {
  slug: string;
  enabled: boolean;
  indexable: boolean;
  cards: string[];
};

/** Saves a site's page settings. Returns the problem in plain words, or the saved row. */
export async function savePublicPage(
  owned: Site,
  input: PublicPageInput,
): Promise<{ error: string } | { page: PublicPage; previousSlug: string | null }> {
  const slug = input.slug.trim().toLowerCase();
  const problem = slugProblem(slug);
  if (problem) return { error: problem };
  const cards = publicCardIds.filter((id) => input.cards.includes(id)) as CardId[];
  if (cards.length === 0) return { error: "Pick at least one card to show." };
  const taken = await db.query.publicPage.findFirst({
    where: and(eq(publicPage.slug, slug), ne(publicPage.siteId, owned.id)),
  });
  if (taken) return { error: "That address is taken. Try another." };
  const previous = await getSitePublicPage(owned.id);
  const set = { slug, enabled: input.enabled, indexable: input.indexable, cards };
  const [page] = await db
    .insert(publicPage)
    .values({ siteId: owned.id, userId: owned.userId, ...set })
    .onConflictDoUpdate({ target: publicPage.siteId, set })
    .returning();
  return { page: page!, previousSlug: previous?.slug ?? null };
}
