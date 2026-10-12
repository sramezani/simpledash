import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { defaultPublicCardIds, publicCardIds, type CardId } from "@/config/cards";
import { db } from "@/lib/db/client";
import { publicPage, site, type PublicPage } from "@/lib/db/schema";
import { slugCandidates, slugFromDomain, slugProblem } from "./slug";

/** The user's public page settings, or null when they never turned it on. */
export function getMyPublicPage(userId: string): Promise<PublicPage | undefined> {
  return db.query.publicPage.findFirst({ where: eq(publicPage.userId, userId) });
}

/** The dashboard card's one-click "Turn on": a slug from the domain and the default cards. */
export async function turnOnPublicPage(userId: string): Promise<PublicPage> {
  const existing = await getMyPublicPage(userId);
  if (existing) {
    const [row] = await db
      .update(publicPage)
      .set({ enabled: true })
      .where(eq(publicPage.userId, userId))
      .returning();
    return row!;
  }
  const active = await db.query.site.findFirst({
    where: and(eq(site.userId, userId), eq(site.isActive, true)),
  });
  const base = slugFromDomain(active?.domain ?? active?.displayName ?? "my-site");
  for (const slug of slugCandidates(base)) {
    const [row] = await db
      .insert(publicPage)
      .values({ userId, slug, enabled: true, cards: [...defaultPublicCardIds], indexable: true })
      .onConflictDoNothing()
      .returning();
    if (row) return row;
    // Nothing inserted: the slug is taken, or a second click already made this user's page.
    const mine = await getMyPublicPage(userId);
    if (mine) return mine;
  }
  // Very unlikely: every numbered candidate is taken.
  const [row] = await db
    .insert(publicPage)
    .values({
      userId,
      slug: `${base.slice(0, 30)}-${crypto.randomUUID().slice(0, 8)}`,
      enabled: true,
      cards: [...defaultPublicCardIds],
    })
    .returning();
  return row!;
}

export type PublicPageInput = {
  slug: string;
  enabled: boolean;
  indexable: boolean;
  cards: string[];
};

/** Saves the settings. Returns the problem in plain words, or the saved row. */
export async function savePublicPage(
  userId: string,
  input: PublicPageInput,
): Promise<{ error: string } | { page: PublicPage; previousSlug: string | null }> {
  const slug = input.slug.trim().toLowerCase();
  const problem = slugProblem(slug);
  if (problem) return { error: problem };
  const cards = publicCardIds.filter((id) => input.cards.includes(id)) as CardId[];
  if (cards.length === 0) return { error: "Pick at least one card to show." };
  const taken = await db.query.publicPage.findFirst({
    where: and(eq(publicPage.slug, slug), ne(publicPage.userId, userId)),
  });
  if (taken) return { error: "That address is taken. Try another." };
  const previous = await getMyPublicPage(userId);
  const [page] = await db
    .insert(publicPage)
    .values({ userId, slug, enabled: input.enabled, indexable: input.indexable, cards })
    .onConflictDoUpdate({
      target: publicPage.userId,
      set: { slug, enabled: input.enabled, indexable: input.indexable, cards },
    })
    .returning();
  return { page: page!, previousSlug: previous?.slug ?? null };
}
