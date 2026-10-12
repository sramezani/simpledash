import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user, userSettings, type UserSettings } from "@/lib/db/schema";

/** The user's settings row, created with the defaults (weekly email on) if it's missing. */
export async function getSettings(userId: string): Promise<UserSettings> {
  const row = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
  if (row) return row;
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  return (await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) }))!;
}

/** Turns the Monday email on or off. Turning it off also hides the dashboard notice. */
export async function setWeeklyEmail(userId: string, on: boolean) {
  const set = { weeklyEmail: on, ...(on ? {} : { emailNoticeDismissed: true }) };
  const updated = await db
    .update(userSettings)
    .set(set)
    .where(eq(userSettings.userId, userId))
    .returning({ userId: userSettings.userId });
  if (updated.length > 0) return;
  // No settings row yet. An old unsubscribe link may belong to a deleted account: nothing to do.
  const owner = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true },
  });
  if (!owner) return;
  await db
    .insert(userSettings)
    .values({ userId, weeklyEmail: on, emailNoticeDismissed: !on })
    .onConflictDoUpdate({ target: userSettings.userId, set });
}

export async function dismissEmailNotice(userId: string) {
  await db
    .insert(userSettings)
    .values({ userId, emailNoticeDismissed: true })
    .onConflictDoUpdate({ target: userSettings.userId, set: { emailNoticeDismissed: true } });
}
