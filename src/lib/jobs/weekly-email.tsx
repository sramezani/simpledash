import "server-only";
import { render } from "@react-email/components";
import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { paidUserIds } from "@/lib/billing/billing";
import { entitlements, planState } from "@/lib/billing/plan";
import { db } from "@/lib/db/client";
import { billing, emailSend, site, user, userSettings, type Site } from "@/lib/db/schema";
import { buildWeeklyEmail, type SiteWeekInput, type WeeklyEmailData } from "@/lib/email/content";
import { sendBatch, type OutgoingEmail } from "@/lib/email/send";
import { unsubscribeToken } from "@/lib/email/unsubscribe";
import { isLastSendHour, isSendTime } from "@/lib/email/week";
import { WeeklyEmail } from "@/lib/email/weekly-email";
import { env } from "@/lib/env";
import { loadReports, warm } from "@/lib/ga4/data";
import { mapLimit } from "@/lib/ga4/property-choice";
import { lacksHistory, rangeWindow } from "@/lib/ga4/ranges";
import type { ReportName } from "@/lib/ga4/reports";
import { reportError } from "@/lib/report-error";
import { siteList } from "@/lib/sites/access";

const EMAIL_REPORTS: ReportName[] = ["totals", "sources", "pages", "actions", "ai_sources"];

type Prepared = { userId: string; weekStart: string; email: OutgoingEmail };
type Account = { userId: string; email: string; main: Site; sites: Site[] };

/**
 * The accounts that get the email: Pro (the Monday email is a Pro feature), with it on
 * and at least one working site in their list. Their sites come in list order with the
 * main (active) one first.
 */
async function accounts(): Promise<Account[]> {
  const people = await db
    .select({ userId: user.id, email: user.email, billing })
    .from(user)
    .innerJoin(userSettings, eq(userSettings.userId, user.id))
    .innerJoin(billing, eq(billing.userId, user.id))
    .where(and(eq(userSettings.weeklyEmail, true), inArray(user.id, paidUserIds())));
  if (people.length === 0) return [];
  const rows = await db
    .select()
    .from(site)
    .where(
      and(
        inArray(
          site.userId,
          people.map((p) => p.userId),
        ),
        or(isNotNull(site.addedAt), eq(site.isActive, true)),
      ),
    );
  return people.flatMap((p) => {
    const ent = entitlements(planState(p.billing));
    if (!ent.weeklyEmail) return [];
    const list = siteList(rows.filter((s) => s.userId === p.userId));
    const main = list.find((s) => s.isActive) ?? list[0];
    const sites = list.filter((s) => s.status === "ok");
    if (!main || sites.length === 0) return [];
    // The main site's block comes first.
    sites.sort((a, b) => Number(b.id === main.id) - Number(a.id === main.id));
    return [{ userId: p.userId, email: p.email, main, sites }];
  });
}

/**
 * Hourly at :00 (docs/SPEC.md sections 14, 20 and 28.1). Sends last week's numbers,
 * one block per site, to accounts whose main site's local time is Monday afternoon,
 * with the email on, the account on Pro and at least one site working. A row in
 * email_send is claimed first, so a week's email can only go out once; it is released
 * again if the send fails.
 */
export async function weeklyEmailJob(now: Date = new Date()) {
  const candidates = await accounts();
  const due = candidates.filter((c) => isSendTime(now, c.main.timeZone));

  let skipped = 0;
  let failed = 0;
  const prepared = (
    await mapLimit(due, 3, async (account): Promise<Prepared | null> => {
      const { userId } = account;
      const weekStart = rangeWindow("7d", account.main.timeZone, now).current.start;
      // A claim without a message ID older than 30 minutes was left by a run that died
      // (a deploy, a crash) before sending: take it over.
      const claimed = await db
        .insert(emailSend)
        .values({ userId, weekStart, sentAt: now })
        .onConflictDoUpdate({
          target: [emailSend.userId, emailSend.weekStart],
          set: { sentAt: now },
          setWhere: and(
            isNull(emailSend.providerMessageId),
            lt(emailSend.sentAt, new Date(now.getTime() - 30 * 60 * 1000)),
          ),
        })
        .returning();
      if (claimed.length === 0) return null; // already sent (or being sent) this week
      const release = () =>
        db
          .delete(emailSend)
          .where(and(eq(emailSend.userId, userId), eq(emailSend.weekStart, weekStart)));
      try {
        // Only last week's own numbers: if Google can't be asked for a site now, try
        // again next hour rather than send a cached copy of another week. In the last
        // hour of the window, that site is left out instead.
        const warmed = await Promise.all(account.sites.map((s) => warm(s, "7d", EMAIL_REPORTS)));
        const ready = account.sites.filter(
          (_, i) => warmed[i] === "warmed" || warmed[i] === "fresh",
        );
        if (ready.length < account.sites.length && !isLastSendHour(now, account.main.timeZone)) {
          skipped++;
          await release();
          return null;
        }
        const sites = await Promise.all(ready.map((s) => siteWeek(s, now)));
        const token = unsubscribeToken(userId, env.EMAIL_TOKEN_SECRET);
        const data = buildWeeklyEmail({
          sites,
          links: {
            settings: `${env.APP_URL}/settings/email`,
            unsubscribe: `${env.APP_URL}/email/unsubscribe?token=${encodeURIComponent(token)}`,
          },
        });
        if (!data) {
          skipped++;
          await release(); // no visitors on any site either week: nothing to send
          return null;
        }
        return {
          userId,
          weekStart,
          email: {
            to: account.email,
            subject: data.subject,
            ...(await renderEmail(data)),
            unsubscribeUrl: `${env.APP_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
          },
        };
      } catch (error) {
        failed++;
        await release();
        reportError("Weekly email: preparing failed", error, { userId });
        return null;
      }
    })
  ).filter((p): p is Prepared => p !== null);

  let sent = 0;
  for (let i = 0; i < prepared.length; i += 100) {
    const batch = prepared.slice(i, i + 100);
    try {
      const ids = await sendBatch(batch.map((p) => p.email));
      await Promise.all(
        batch.map((p, j) =>
          db
            .update(emailSend)
            // Never leave it empty: an empty ID marks an unfinished claim (see above).
            .set({ providerMessageId: ids[j] ?? "sent" })
            .where(and(eq(emailSend.userId, p.userId), eq(emailSend.weekStart, p.weekStart))),
        ),
      );
      sent += batch.length;
    } catch (error) {
      failed += batch.length;
      await Promise.all(
        batch.map((p) =>
          db
            .delete(emailSend)
            .where(and(eq(emailSend.userId, p.userId), eq(emailSend.weekStart, p.weekStart))),
        ),
      );
      reportError("Weekly email: sending failed", error, { count: batch.length });
    }
  }
  return { candidates: candidates.length, due: due.length, sent, skipped, failed };
}

/** One site's last week, from the reports just warmed. */
async function siteWeek(s: Site, now: Date): Promise<SiteWeekInput> {
  const result = await loadReports(s, "7d", EMAIL_REPORTS, { now });
  return {
    siteLabel: s.domain ?? s.displayName,
    window: result.window,
    totals: result.reports.totals.data,
    sources: result.reports.sources.data,
    pages: result.reports.pages.data,
    actions: result.reports.actions.data,
    aiSources: result.reports.ai_sources.data,
    signupEvent: s.signupEvent,
    comparable: !lacksHistory(result.window, s.propertyCreatedAt),
    dashboard: `${env.APP_URL}/dashboard?site=${s.id}`,
  };
}

export async function renderEmail(data: WeeklyEmailData) {
  const element = <WeeklyEmail data={data} />;
  return { html: await render(element), text: await render(element, { plainText: true }) };
}
