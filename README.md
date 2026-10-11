# SimpleDash

**Google Analytics, in a dash.**

SimpleDash ([simpledash.app](https://simpledash.app)) takes the Google Analytics 4 data a site already has and turns it into:

- one simple dashboard page
- a weekly Monday email
- an optional public stats page

There is no new tracking script. Visitor data comes from the user's own GA4 property through Google's read-only APIs.

**Price:** the Starter plan costs €9 a month or €90 a year, with a 14-day free trial and no card. A Growth plan (€19 a month) is coming soon.

## Status

Planning is done (Oct 11, 2026). Later the same day it was updated with the yearly price, the theme file and the UI rules. **Sprint 0 (project setup) is next**. There is no app code yet, so there is nothing to install or run. Progress is tracked in [docs/CHECKLIST.md](docs/CHECKLIST.md).

## Docs

| File | What's in it |
| --- | --- |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Product brief: what to build and why |
| [docs/SPEC.md](docs/SPEC.md) | Technical spec for V1: how it's built |
| [docs/CHECKLIST.md](docs/CHECKLIST.md) | Sprint tasks, ticked with the date as they finish |
| [docs/STORY.md](docs/STORY.md) | Session log: what was done and learned, and what's next |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Technical decisions, one line each with the reason |
| [CLAUDE.md](CLAUDE.md) | Brief and working rules for Claude Code |

## Theme and brand

The look of the whole site and the brand facts live in one file, `src/config/theme.ts`: colours, corner radius, shadows, name, tagline and contact email.

- Editing it re-themes the site, the weekly email, the social images and the favicons.
- The code only uses its tokens. `npm run check` blocks raw colours and checks contrast.
- The file arrives in Sprint 0. How it works is in [docs/SPEC.md section 18](docs/SPEC.md#18-design-performance-and-accessibility).

## Setup, scripts and environment variables

These sections get filled in during Sprint 0, as the code arrives.

- **Requirements:** Node 24, npm, and Docker (Docker Desktop or OrbStack).
- **Environment variables:** the planned list is in [docs/SPEC.md section 22](docs/SPEC.md#22-environment-variables). `.env.example` arrives in Sprint 0.
