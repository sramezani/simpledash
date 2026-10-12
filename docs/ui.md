# UI: theme, tokens and components

How the look of SimpleDash is built and kept consistent. The rules behind it are in `docs/SPEC.md` sections 4 and 18.

## The theme file

`src/config/theme.ts` is the only place for colours, corner radius, shadows and brand facts.

- **`brandColor`** at the top is the main colour. It feeds `primary`, `ring`, `brand` and `chart-1`, so changing it is a one-line edit.
- **`neutral`** is the grey scale. It feeds the surfaces, borders and quiet text.
- **`brand`** holds the name (SimpleDash), tagline, description, URL and support email.
- **`colors.light`** holds every colour token as hex. Hex works in CSS, in email clients and in the image renderer.
- **`radius`** is the base corner radius. Tailwind's `rounded-sm` to `rounded-2xl` are worked out from it.
- **`shadows`** are for raised layers only (menus, dialogs). Cards stay flat with a 1 px edge.
- **`textPairs`** and **`uiPairs`** list the colour pairs the contrast test checks. Add a pair when a new token is used as text on a new background.

Light theme only in V1. A `colors.dark` palette with the same keys can be added later.

## How the values reach the page

1. `src/lib/theme/css.ts` turns the theme into CSS variables on `:root` (`--primary: #…`). It is a pure, tested function.
2. `<ThemeStyle />` (`src/lib/theme/theme-style.tsx`) writes that CSS into `<head>`, from the root layout and from `global-error.tsx`. An edit shows at once in development.
3. `src/app/globals.css` maps each variable to a Tailwind colour in `@theme inline`, so classes like `bg-primary` and `text-muted-foreground` exist. It holds no colour values.

Outside the page, the same values are imported directly: the favicons (`src/app/icon.tsx`, `apple-icon.tsx`), Open Graph images, the weekly email and the live globe.

**Fonts** are the one exception: `src/lib/theme/fonts.ts` loads Geist with `next/font`, because Next.js needs those calls in their own module.

## Tokens

| Group | Tokens | Classes |
| --- | --- | --- |
| Surfaces and text | `background`, `foreground`, `card`, `popover`, `muted`, `secondary`, `accent`, each with `-foreground` | `bg-card`, `text-muted-foreground` |
| Actions | `primary`, `primary-foreground`, `ring`, `destructive`, `destructive-foreground` | `bg-primary`, `ring-ring` |
| Lines | `border`, `input` | `border-border`, `border-input` |
| Brand | `brand` | `text-brand` (the dash in the logo) |
| Changes | `positive`, `negative` | `text-positive`: always with an arrow and a word |
| Notes | `warning` | `text-warning`: "Still updating" and quota notes |
| Charts | `chart-1` … `chart-5` | `stroke-chart-1`; `chart-1` is the visitors line |
| Layers | `overlay` | `bg-overlay/50` behind dialogs |

Opacity modifiers work on every token, for example `bg-primary/10` for the share bars in ranked lists.

## The guards (part of `npm run check`)

1. **Only tokens exist.** `globals.css` removes Tailwind's palette (`--color-*: initial`), so `bg-blue-500` doesn't exist.
2. **No raw colours.** ESLint blocks hex and colour-function strings, palette classes (`text-white`, `bg-black/50`), and arbitrary colour or font-size classes (`bg-[#…]`, `text-[13px]`), everywhere except `src/config/theme.ts` and tests.
3. **Nothing missing.** `src/lib/theme/theme.test.ts` checks that every token has a mapping in `globals.css`, every mapping has a token, and `globals.css` holds no colours.
4. **Contrast.** The same test checks WCAG AA: 4.5:1 for every pair in `textPairs`, and 3:1 for `uiPairs` (focus ring and chart lines). A failing pair is named in the message.

Shadcn's `dark:` classes never apply: `globals.css` makes the `dark` variant class-based, and the class is never set.

## Component layers

Each layer imports only from its own folder and the layers before it. ESLint (`no-restricted-imports` in `eslint.config.mjs`) enforces this, and parent imports (`../`) are blocked so every import goes through `@/`.

| Layer | Folder | May import |
| --- | --- | --- |
| 1. Product data | `src/config/` | nothing from the app |
| 2. Primitives | `src/components/ui/` | other ui parts, `lib/utils` |
| 3. Building blocks | `src/components/shared/` | config, ui, shared, `lib/utils`, `lib/format` |
| 4. Features | `src/components/{cards,charts,globe,marketing,settings,dashboard,public-page}/` | everything above and `src/lib` |
| 5. Routes | `src/app/` | everything |

`src/lib/` holds helpers and data access. It may import `src/config` and other `lib` modules, never components or routes.

## Adding a component

1. **Look first** in `src/components/ui`, `src/components/shared` and `src/lib` (CodeGraph helps).
2. **shadcn parts** are added with the CLI: `npx shadcn add <name>`. Then check them:
   - imports must use `@/lib/utils` (the CLI sometimes writes a bare `"cn"` import and installs an unrelated `cn` package; remove it);
   - move any raw colours onto tokens (`text-white` → `text-primary-foreground`, `bg-black/50` → `bg-overlay/50`);
   - `npm run lint` lists anything left.
3. **A new look** is a prop or a `cva` variant on the existing component, never a copy.
4. **Show it on `/ui-kit`** (`src/app/(dev)/ui-kit/page.tsx`), the dev-only page with every token and block. It is a 404 in production.

## Shared blocks

| Block | File | What it is |
| --- | --- | --- |
| `Logo`, `LogoMark`, `LogoTile` | `logo.tsx` | The dash mark and name; `LogoTile` is the inline-styled version for favicons and images |
| `Container` | `container.tsx` | Page width (`max-w-6xl`) and side padding |
| `CardShell` | `card-shell.tsx` | Every card: title, ⓘ help, actions, note, dimmed state. A size container (`@container`) |
| `HelpTip`, `PopoverButton` | `help-tip.tsx`, `popover-button.tsx` | A button that opens a small panel: native `popover`, anchored with CSS where supported. No JavaScript |
| `StatValue`, `Delta` | `stat-value.tsx`, `delta.tsx` | The big number, and its change with an arrow and a word (never colour alone) |
| `Notice` | `notice.tsx` | Banners for states: info, warning, danger, with one action |
| `EmptyState` | `empty-state.tsx` | What a card shows instead of a fake zero |
| `SegmentedLinks` | `segmented-links.tsx` | A segmented control made of links (the date switch, `?range=`) |
| `SegmentedRadio` | `segmented-radio.tsx` | Radio buttons styled as a segmented control; other parts react to it with `:has()` |
| `ViewToggle` | `view-toggle.tsx` | Two views of a card ("Sources \| Channels"), CSS only |
| `RankedList` | `ranked-list.tsx` | Sources, Pages, Countries, Devices: icon, label, values, share bar, "Show more" (CSS only) |
| `Flag` | `flag.tsx` | A country flag from `public/flags` (48 × 36 PNGs, shown at 16 × 12) |
| `SiteIcon` | `site-icon.tsx` | A source's icon through `/api/icon/<domain>`, or a generic one |
| `GoogleButton` | `google-button.tsx` | A submit button with Google's "G", for forms that start Google sign-in |
| `BillingSwitch` | `billing-switch.tsx` | Monthly / Yearly radios named `interval`: the pricing section and the upgrade form. Prices switch with `group-has-[[data-option-index='1']:checked]/billing:` |
| `CsvLink` | `csv-link.tsx` | "Download CSV" in a card's header, a plain link |

Charts (`src/components/charts/`): `VisitorsChart` (Recharts, dashboard only, lazy) and `StaticLineChart` (server-rendered SVG with HTML labels, for the landing demo and public pages). Both use the tested data prep in `src/lib/charts/series.ts`.

All of them are on `/ui-kit`, and `/ui-kit/dashboard?state=…` shows the dashboard in every state.

**No JavaScript where it isn't needed.** Card toggles, "Show more", "View as table" and the help popovers are plain HTML and CSS (`:has()`, `popover`). The same cards therefore run on the landing demo and public pages without adding scripts. The dashboard's only client parts are the chart (Recharts, loaded in its own chunk), the site switcher, the signup picker form and the refresh-after-stale timer.

shadcn parts in `src/components/ui`: `button`, `badge`, `card`, `separator`, `skeleton`, `input`, `label`, `dropdown-menu`, `chart`. The button has a 44 px minimum height on touch screens (`pointer-coarse:min-h-11`); small icon buttons get the same target with an invisible `after:` overlay instead, so they don't push the layout.
