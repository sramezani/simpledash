# Weekly email

The Monday email with last week's numbers: one email per account, one block per site. The plan is in `docs/SPEC.md` sections 14 and 28.1.

## Files

| File | What it does | Tested |
| --- | --- | --- |
| `src/lib/email/week.ts` | Local time in the site's time zone; "is it Monday between 13:00 and 17:59 there?"; the last hour of that window | yes |
| `src/lib/email/content.ts` | A block per site (summary, the 4 numbers, top 3 sources and pages, the AI line, its own dashboard link), the subject, and nothing when no site had visitors in either week | yes |
| `src/lib/email/weekly-email.tsx` | The React Email template. Colours and name come from `src/config/theme.ts` as inline styles | |
| `src/lib/email/unsubscribe.ts` | Signed unsubscribe tokens (HMAC-SHA256 of the user ID with `EMAIL_TOKEN_SECRET`) | yes |
| `src/lib/email/send.ts` | Resend batch sends (up to 100 a call) with `List-Unsubscribe` and `List-Unsubscribe-Post` headers | |
| `src/lib/email/settings.ts` | The user's settings row: email on or off, and the dashboard notice | |
| `src/lib/jobs/weekly-email.tsx` | The hourly job | |
| `src/app/email/unsubscribe/page.tsx`, `src/app/api/email/unsubscribe/route.ts` | The unsubscribe page (a button) and the one-click endpoint mail apps call | |

## When it's sent

The `weekly-email` job runs every hour (`node scripts/run-job.mjs weekly-email`, at :00). It picks accounts that:

- have the weekly email on (it is on by default),
- are on Pro (the Monday email is a Pro feature since Oct 14, 2026; Free accounts are skipped and Settings says so),
- have at least one site with status `ok` in their list (every listed site gets a block; there is no site limit),
- and whose main site's local time is Monday between 13:00 and 17:59. The main site is the active one (the one opened most recently).

For each one it first **claims** a row in `email_send` (user and week). The key makes a second email in the same week impossible. Then it refreshes each site's reports for last Monday to Sunday (`lastWeekRange`, a custom range: the dashboard's Last 7 days includes today, so the email has its own week; `totals`, `sources`, `pages`, `actions`, `ai_sources`), builds one block per site (the main site first) and sends the emails in batches.

- If Google can't be asked right now for one of the sites (quota, outage), the claim is released and the next hour tries again. In the last hour of the window (17:00), that site is left out instead, so the others still arrive. A cached copy of another week is never sent.
- Sites with no visitors in either week are left out. With none left, or when the send fails, the claim is released.
- If the job dies between the claim and the send (a deploy), a claim without a message ID that is older than 30 minutes is taken over by the next run.
- The window ends at 17:59 so it never arrives in the evening.

Sentry's cron monitor `weekly-email` notices when the job stops running or fails.

## What it says

- **Subject:** one site: "mysite.com: 1,234 visitors last week (up 23%)". Several: "Last week: mysite.com 1,234 visitors (up 23%), and 2 more sites".
- Per site: the summary line, the 4 numbers for Monday to Sunday against the week before (Signups only when a signup action is chosen), the top 3 sources and pages, a line about AI assistants when there were any, then up to three lines from `docs/SPEC.md` section 31 (What moved; the first What brings customers line for the last 30 days; This week on Google search, with "See what to do"), and a link to that site's dashboard (`/dashboard?site=<id>`). With one site the link is the "Open your dashboard" button; with several each block has its heading and dates.
- **Footer:** why they get it, a settings link (`/settings/email`) and the unsubscribe link.
- Preview it at `/ui-kit/email` (development only; `?text=1` shows the plain-text part, `?sites=3` an account with three sites).

## Turning it off

- The dashboard notice "Every Monday we'll email you last week's numbers." has **Turn off** and **Got it**.
- Settings → Weekly email has **Turn off** / **Turn on**.
- The unsubscribe link opens `/email/unsubscribe?token=…` with one button, so link scanners in mail apps can't unsubscribe anyone by opening it. Mail apps' own unsubscribe button posts to `/api/email/unsubscribe` (RFC 8058 one-click).

## Resend setup (Siamak)

1. Resend → Domains → add `simpledash.app`, region EU.
2. Add the SPF, DKIM and return-path records it shows in Cloudflare DNS (DNS only, grey cloud), and a DMARC record, for example `_dmarc` TXT `v=DMARC1; p=quarantine; rua=mailto:hello@simpledash.app`.
3. Wait for "Verified", then put the API key in `RESEND_API_KEY`.
4. Resend's free plan sends 100 emails a day: move to Pro before about 90 users have the email on.
