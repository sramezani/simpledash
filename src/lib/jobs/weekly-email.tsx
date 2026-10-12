import "server-only";
import { render } from "@react-email/components";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { unlockedUserIds } from "@/lib/billing/billing";
import { db } from "@/lib/db/client";
import { emailSend, site, user, userSettings } from "@/lib/db/schema";
import { buildWeeklyEmail, type WeeklyEmailData } from "@/lib/email/content";
import { sendBatch, type OutgoingEmail } from "@/lib/email/send";
import { unsubscribeToken } from "@/lib/email/unsubscribe";
import { isSendTime } from "@/lib/email/week";
import { WeeklyEmail } from "@/lib/email/weekly-email";
import { env } from "@/lib/env";
import { loadReports, warm } from "@/lib/ga4/data";
import { mapLimit } from "@/lib/ga4/property-choice";
import { lacksHistory, rangeWindow } from "@/lib/ga4/ranges";
import type { ReportName } from "@/lib/ga4/reports";
import { reportError } from "@/lib/report-error";

const EMAIL_REPORTS: ReportName[] = ["totals", "sources", "pages", "actions", "ai_sources"];

type Prepared = { userId: string; weekStart: string; email: OutgoingEmail };

/**
 * Hourly at :00 (docs/SPEC.md sections 14 and 20). Sends last week's numbers to
 * users whose site's local time is Monday afternoon, with the email on, the account
 * not locked and the site working. A row in email_send is claimed first, so a week's
 * email can only go out once; it is released again if the send fails.
 */
export async function weeklyEmailJob(now: Date = new Date()) {
  const candidates = await db
    .select({ site, email: user.email })
    .from(site)
    .innerJoin(user, eq(user.id, site.userId))
    .innerJoin(userSettings, eq(userSettings.userId, site.userId))
    .where(
      and(
        eq(site.isActive, true),
        eq(site.status, "ok"),
        eq(userSettings.weeklyEmail, true),
        inArray(site.userId, unlockedUserIds(now)),
      ),
    );
  const due = candidates.filter((c) => isSendTime(now, c.site.timeZone));

  let skipped = 0;
  let failed = 0;
  const prepared = (
    await mapLimit(due, 3, async ({ site: s, email }): Promise<Prepared | null> => {
      const window = rangeWindow("7d", s.timeZone, now);
      const weekStart = window.current.start;
      // A claim without a message ID older than 30 minutes was left by a run that died
      // (a deploy, a crash) before sending: take it over.
      const claimed = await db
        .insert(emailSend)
        .values({ userId: s.userId, weekStart, sentAt: now })
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
          .where(and(eq(emailSend.userId, s.userId), eq(emailSend.weekStart, weekStart)));
      try {
        // Only last week's own numbers: if Google can't be asked now, try again next hour
        // rather than send a cached copy of another week.
        const warmed = await warm(s, "7d", EMAIL_REPORTS);
        if (warmed !== "warmed" && warmed !== "fresh") {
          skipped++;
          await release();
          return null;
        }
        const result = await loadReports(s, "7d", EMAIL_REPORTS, { now });
        const token = unsubscribeToken(s.userId, env.EMAIL_TOKEN_SECRET);
        const data = buildWeeklyEmail({
          siteLabel: s.domain ?? s.displayName,
          window: result.window,
          totals: result.reports.totals.data,
          sources: result.reports.sources.data,
          pages: result.reports.pages.data,
          actions: result.reports.actions.data,
          aiSources: result.reports.ai_sources.data,
          signupEvent: s.signupEvent,
          comparable: !lacksHistory(result.window, s.propertyCreatedAt),
          links: {
            dashboard: `${env.APP_URL}/dashboard`,
            settings: `${env.APP_URL}/settings#email`,
            unsubscribe: `${env.APP_URL}/email/unsubscribe?token=${encodeURIComponent(token)}`,
          },
        });
        if (!data) {
          skipped++;
          await release(); // no visitors either week: nothing to send
          return null;
        }
        return {
          userId: s.userId,
          weekStart,
          email: {
            to: email,
            subject: data.subject,
            ...(await renderEmail(data)),
            unsubscribeUrl: `${env.APP_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
          },
        };
      } catch (error) {
        failed++;
        await release();
        reportError("Weekly email: preparing failed", error, { userId: s.userId });
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

export async function renderEmail(data: WeeklyEmailData) {
  const element = <WeeklyEmail data={data} />;
  return { html: await render(element), text: await render(element, { plainText: true }) };
}
