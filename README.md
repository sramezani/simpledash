# SimpleDash

**Google Analytics, in a dash.**

SimpleDash ([simpledash.app](https://simpledash.app)) takes the Google Analytics 4 data a site already has and turns it into:

- one simple dashboard page
- a weekly Monday email
- an optional public stats page

There is no new tracking script. Visitor data comes from the user's own GA4 property through Google's read-only APIs.

## Status

Planning is done (Oct 11, 2026), and **Sprint 0 (project setup) is next**. There is no app code yet, so there is nothing to install or run. Progress is tracked in [docs/CHECKLIST.md](docs/CHECKLIST.md).

## Docs

| File | What's in it |
| --- | --- |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Product brief: what to build and why |
| [docs/SPEC.md](docs/SPEC.md) | Technical spec for V1: how it's built |
| [docs/CHECKLIST.md](docs/CHECKLIST.md) | Sprint tasks, ticked with the date as they finish |
| [docs/STORY.md](docs/STORY.md) | Session log: what was done and learned, and what's next |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Technical decisions, one line each with the reason |
| [CLAUDE.md](CLAUDE.md) | Brief and working rules for Claude Code |

## Setup, scripts and environment variables

These sections get filled in during Sprint 0, as the code arrives.

- **Requirements:** Node 24, npm, and Docker (Docker Desktop or OrbStack).
- **Environment variables:** the planned list is in [docs/SPEC.md §22](docs/SPEC.md#22-environment-variables). `.env.example` arrives in Sprint 0.
