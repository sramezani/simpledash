import "server-only";
import { eq } from "drizzle-orm";
import { defaultPublicCardIds, publicCardIds, type CardId } from "@/config/cards";
import { db } from "@/lib/db/client";
import { publicPage, type PublicPage, type Site } from "@/lib/db/schema";
import { slugCandidates, slugFromDomain } from "./slug";

/** A site's public page settings, or undefined when it was never turned on. */
export function getSitePublicPage(siteId: string): Promise<PublicPage | undefined> {
  return db.query.publicPage.findFirst({ where: eq(publicPage.siteId, siteId) });
}

type PageSettings = { enabled: boolean; indexable: boolean; cards: CardId[] };

/**
 * A site's first public page. Its address comes from the site's domain and never changes, so
 * shared links keep working: `mysite.com` → `mysite-com`. Only when that address is taken (two
 * accounts connected the same site) does it get a number: `mysite-com-2`.
 */
async function createPublicPage(owned: Site, settings: PageSettings): Promise<PublicPage> {
  const base = slugFromDomain(owned.domain ?? owned.displayName);
  const values = { siteId: owned.id, userId: owned.userId, ...settings };
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

/** The dashboard card's one-click "Turn on": the address from the domain and the default cards. */
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
  return createPublicPage(owned, {
    enabled: true,
    indexable: true,
    cards: [...defaultPublicCardIds],
  });
}

/** What Settings → Public page can change. The address isn't one of them. */
export type PublicPageInput = {
  enabled: boolean;
  indexable: boolean;
  cards: string[];
};

/** Saves a site's page settings. Returns the problem in plain words, or the saved row. */
export async function savePublicPage(
  owned: Site,
  input: PublicPageInput,
): Promise<{ error: string } | { page: PublicPage }> {
  const cards = publicCardIds.filter((id) => input.cards.includes(id)) as CardId[];
  if (cards.length === 0) return { error: "Pick at least one card to show." };
  const settings = { enabled: input.enabled, indexable: input.indexable, cards };
  const existing = await getSitePublicPage(owned.id);
  if (!existing) return { page: await createPublicPage(owned, settings) };
  const [page] = await db
    .update(publicPage)
    .set(settings)
    .where(eq(publicPage.siteId, owned.id))
    .returning();
  return { page: page! };
}
