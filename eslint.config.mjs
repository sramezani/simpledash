import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Guard 2 of the theme (docs/SPEC.md section 18): no raw colours outside src/config/theme.ts.
 * Blocks hex and colour-function strings, Tailwind palette classes (which don't exist anyway,
 * because globals.css removes the palette), and arbitrary colour or font-size classes.
 */
const colorUtilities =
  "(?:bg|text|border|border-[trblxy]|ring|ring-offset|fill|stroke|outline|decoration|from|via|to|shadow|accent|caret|divide|placeholder)";
const paletteNames =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)";
const rawColourPatterns = [
  ["#[0-9a-fA-F]{3,8}\\b", "Raw hex colour. Use a theme token from src/config/theme.ts."],
  [
    "\\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix)\\(",
    "Raw colour function. Use a theme token from src/config/theme.ts.",
  ],
  [
    `(?:^|[\\s:"'])${colorUtilities}-${paletteNames}\\b`,
    "Tailwind palette colour. Use a token class such as bg-primary or text-muted-foreground.",
  ],
  [
    `(?:^|[\\s:"'])${colorUtilities}-\\[(?:#|rgb|hsl|oklch|oklab|lab|lch|hwb|color|var\\()`,
    "Arbitrary colour class. Use a token class from the theme.",
  ],
  [
    "(?:^|[\\s:\"'])text-\\[\\d",
    "Arbitrary font size. Use Tailwind's type scale (text-sm, text-base, ...).",
  ],
];
const noRawColours = [
  "error",
  ...rawColourPatterns.flatMap(([pattern, message]) => [
    { selector: `Literal[value=/${pattern}/]`, message },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
  ]),
];

/*
 * Code layers (docs/SPEC.md section 4). Each layer imports only from its own folder and the
 * layers before it: config → components/ui → components/shared → feature folders → app.
 */
const noParentImports = {
  regex: "^\\.\\./",
  message: "Import with the @/ alias, so the layer rules can see where the import comes from.",
};
const layer = (files, allowed, message) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          noParentImports,
          ...(allowed === null ? [] : [{ regex: `^@/(?!${allowed.join("|")})`, message }]),
        ],
      },
    ],
  },
});
const featureFolders = [
  "cards",
  "charts",
  "globe",
  "marketing",
  "settings",
  "dashboard",
  "public-page",
  "search",
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": noRawColours,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/config/theme.ts", "**/*.test.ts", "**/*.test.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
  layer(
    ["src/config/**"],
    ["config/"],
    "src/config holds plain values and imports nothing from the app.",
  ),
  layer(
    ["src/components/ui/**"],
    ["components/ui/", "lib/utils$", "hooks/"],
    "components/ui (shadcn parts) may only import other ui parts and lib/utils.",
  ),
  layer(
    ["src/components/shared/**"],
    ["config/", "components/ui/", "components/shared/", "lib/utils$", "lib/format$"],
    "Shared blocks take props and fetch no data: they may import config, ui, shared, lib/utils and lib/format.",
  ),
  layer(
    featureFolders.map((folder) => `src/components/${folder}/**`),
    ["config/", "components/", "lib/", "hooks/"],
    "Feature components may not import from src/app.",
  ),
  layer(
    ["src/lib/**"],
    ["config/", "lib/"],
    "src/lib holds helpers and data access: no components or routes.",
  ),
  layer(["src/app/**", "src/proxy.ts", "src/instrumentation.ts"], null, ""),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "drizzle/**",
    "node_modules/**",
  ]),
]);
