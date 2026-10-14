# Contributing to SimpleDash

Thanks for helping. SimpleDash is small on purpose, so a short note first saves everyone time.

## Before you start

- **Bugs:** open an issue with what you did, what you expected and what happened. Screenshots help.
- **Features:** open an issue before writing code. SimpleDash follows a roadmap (`docs/ROADMAP.md`) and turns down many good ideas to stay simple.
- **Security problems:** don't open an issue. Follow [SECURITY.md](SECURITY.md).

## The rules the code keeps

These come from [CLAUDE.md](CLAUDE.md), which has the full list:

1. **No tracking script.** All visitor data comes from the user's GA4 property through Google's APIs.
2. **Read-only Google access**, asked for only when needed.
3. **Store as little as possible.** Never visitor-level data.
4. **Plain words on screen.** No GA4 jargon ("Visitors", not "activeUsers").
5. **Never invent explanations** or numbers, and never show a fake zero: missing data shows as "—".
6. **Theme tokens only:** colours, radius and shadows come from `src/config/theme.ts`. Lint blocks raw colours.
7. **Plans and prices** come only from `src/config/plans.ts`.

How things are built is in [docs/SPEC.md](docs/SPEC.md); why, in [docs/DECISIONS.md](docs/DECISIONS.md).

## Working on the code

Setup is in the [README](README.md#setup). Then:

```bash
npm run check   # typecheck, lint and tests
```

- Put tests next to the code (`thing.test.ts`), with Vitest.
- Use server components by default; client components only for interaction.
- Keep pull requests small and focused, and say in the description how you checked the change. For screen changes, add screenshots at phone width (375 px) and desktop width.

## License

By sending a pull request, you agree that your contribution is licensed under the [AGPL-3.0](LICENSE), like the rest of SimpleDash.
