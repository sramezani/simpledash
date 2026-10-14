# Security

SimpleDash holds encrypted Google tokens and, for some users, an encrypted read-only Stripe key, so security reports matter a lot to us.

## Reporting a problem

Email **hello@simpledash.app** with "Security" in the subject. Please include:

- what the problem is and where (a page, an API route, a file in this repo)
- how to reproduce it
- what someone could do with it

Please don't open a public issue, and don't test against other people's accounts or data. We'll reply as soon as we can, keep you updated while we fix it, and credit you if you'd like.

## What's in scope

- simpledash.app and its API routes
- this repository's code, including `deploy/` and the GitHub Actions workflow

Out of scope: reports from automated scanners without a working example, missing headers that don't lead to a real problem, and denial-of-service tests.

## How SimpleDash protects data

- Google access is read-only (`analytics.readonly`, and `webmasters.readonly` only when Search Console is connected).
- Google tokens and Stripe keys are encrypted at rest; backups leave out sign-in sessions.
- Every signed-in page and action checks the user and the site on the server (`requireUser()`, `requireSite()`).
- No visitor-level data is stored. The full list is in the [README](README.md#what-simpledash-stores).
