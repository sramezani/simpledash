# Weekly email

The Monday email with last week's numbers. The plan is in `docs/SPEC.md` section 14.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/lib/email/week.ts` | Local time in the site's time zone; "is it Monday between 13:00 and 17:59 there?" | yes |
| `src/lib/email/content.ts` | Subject, summary, the 4 numbers, top 3 sources and pages, the AI line; nothing when there were no visitors in either week | yes |
| `src/lib/email/weekly-email.tsx` | The React Email template. Colours and name come from `src/config/theme.ts` as inline styles | |
| `src/lib/email/unsubscribe.ts` | Signed unsubscribe tokens (HMAC-SHA256 of the user ID with `EMAIL_TOKEN_SECRET`) | yes |
| `src/lib/email/send.ts` | Resend batch sends (up to 100 a call) with `List-Unsubscribe` and `List-Unsubscribe-Post` headers | |
| `src/lib/email/settings.ts` | The user's settings row: email on or off, and the dashboard notice | |
| `src/lib/jobs/weekly-email.tsx` | The hourly job | |
| `src/app/email/unsubscribe/page.tsx`, `src/app/api/email/unsubscribe/route.ts` | The unsubscribe page (a button) and the one-click endpoint mail apps call | |

## When it's sent

The `weekly-email` job runs every hour (`node scripts/run-job.mjs weekly-email`, at :00). It picks users who:

- have the weekly email on (it is on by default),
- aren't locked (trial over and unpaid),
- have an active site with status `ok`,
- and whose site's local time is Monday between 13:00 and 17:59.

For each one it first **claims** a row in `email_send` (user and week). The key makes a second email in the same week impossible. Then it refreshes the 7-day reports (`totals`, `sources`, `pages`, `actions`, `ai_sources`, which also warms the dashboard), builds the email and sends it in batches.

- If Google can't be asked right now (quota, outage, access ended), there's nothing to send (no visitors in either week) or the send fails, the claim is released and the next hour tries again. A cached copy of another week is never sent.
- If the job dies between the claim and the send (a deploy), a claim without a message ID that is older than 30 minutes is taken over by the next run.
- The window ends at 17:59 so it never arrives in the evening.

Sentry's cron monitor `weekly-email` notices when the job stops running or fails.

## What it says

- **Subject:** "mysite.com: 1,234 visitors last week (up 23%)".
- The summary line, the 4 numbers for Monday to Sunday against the week before (Signups only when a signup action is chosen), the top 3 sources and pages, a line about AI assistants when there were any, and an "Open your dashboard" button.
- **Footer:** why they get it, a settings link (`/settings#email`) and the unsubscribe link.
- Preview it at `/ui-kit/email` (development only; `?text=1` shows the plain-text part).

## Turning it off

- The dashboard notice "Every Monday we'll email you last week's numbers." has **Turn off** and **Got it**.
- Settings → Weekly email has **Turn off** / **Turn on**.
- The unsubscribe link opens `/email/unsubscribe?token=…` with one button, so link scanners in mail apps can't unsubscribe anyone by opening it. Mail apps' own unsubscribe button posts to `/api/email/unsubscribe` (RFC 8058 one-click).

## Resend setup (Siamak)

1. Resend → Domains → add `simpledash.app`, region EU.
2. Add the SPF, DKIM and return-path records it shows in Cloudflare DNS (DNS only, grey cloud), and a DMARC record, for example `_dmarc` TXT `v=DMARC1; p=quarantine; rua=mailto:hello@simpledash.app`.
3. Wait for "Verified", then put the API key in `RESEND_API_KEY`.
4. Resend's free plan sends 100 emails a day: move to Pro before about 90 users have the email on.
