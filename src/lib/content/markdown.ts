import { plainWords } from "@/config/plain-words";
import { FREE_HISTORY_DAYS, plans, type PlanId } from "@/config/plans";
import { brand } from "@/config/theme";
import { ANALYTICS_SCOPE, SEARCH_CONSOLE_SCOPE } from "@/lib/auth/scopes";
import { monthsFreeOnYearly } from "@/lib/billing/prices";
import { formatPrice } from "@/lib/format";
import { durationWords, FRESHNESS, LIVE_REFRESH, type FreshnessKind } from "@/lib/ga4/freshness";

const isPlan = (value: string): value is PlanId => value in plans;

/** The facts our content components show (from the code), as plain text. */
function planFact(name: string, attrs: Record<string, string>): string | null {
  const plan = attrs.plan ?? "";
  switch (name) {
    case "Price": {
      const interval = attrs.interval === "year" ? "year" : "month";
      return isPlan(plan) ? formatPrice(plans[plan].prices[interval]) : null;
    }
    case "FreeDays":
      return String(FREE_HISTORY_DAYS);
    case "MonthsFree":
      return String(monthsFreeOnYearly());
    case "PlanFeatures":
      return isPlan(plan) ? plans[plan].features.map((f) => `- ${f}`).join("\n") : null;
    case "Freshness": {
      const kind = attrs.kind as FreshnessKind;
      const audience = attrs.audience === "public" ? "public" : "owner";
      return kind in FRESHNESS ? durationWords(FRESHNESS[kind][audience]) : null;
    }
    case "LiveRefresh":
      return durationWords(LIVE_REFRESH);
    case "Scope":
      return `\`${attrs.name === "search-console" ? SEARCH_CONSOLE_SCOPE : ANALYTICS_SCOPE}\``;
    case "SupportEmail":
      return brand.supportEmail;
    case "PlainWordsTable":
      return [
        "| In SimpleDash | In Google Analytics or Search Console |",
        "| --- | --- |",
        ...plainWords.map((r) => `| ${r.screen} | ${r.ga4} |`),
      ].join("\n");
    default:
      return null;
  }
}

function parseAttrs(source: string): Record<string, string> {
  return Object.fromEntries([...source.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

/**
 * Removes the indentation that formatting adds inside components (Prettier indents their
 * children), which Markdown would read as code blocks. Code blocks keep their own indentation,
 * less the indentation of their opening fence. Content has no nested lists, so nothing is lost.
 */
function dedent(markdown: string): string {
  let fence: number | null = null;
  return markdown
    .split("\n")
    .map((line) => {
      const indent = line.length - line.trimStart().length;
      if (line.trimStart().startsWith("```")) {
        fence = fence === null ? indent : null;
        return line.trimStart();
      }
      if (fence !== null) return line.slice(Math.min(fence, indent));
      return line.trimStart();
    })
    .join("\n");
}

/** Components whose title becomes a bold line above their text. */
const TITLED = new Set(["Callout", "Accordion", "Tab", "Card", "InSimpleDash"]);

/**
 * A page's processed MDX as plain Markdown for AI assistants (docs/SPEC.md section 30):
 * plan facts become their values (from plans.ts), screenshots are left out, and every other
 * component keeps only its text (a title becomes a bold line). Pure, so it is tested.
 */
export function contentToMarkdown(mdx: string): string {
  return (
    mdx
      // Screenshots: nothing for an assistant to read.
      .replace(/<ImageSlot\b[^>]*\/>/g, "")
      .replace(/<ImageSlot\b[^>]*>[\s\S]*?<\/ImageSlot>/g, "")
      // The code repository, with or without its own link text.
      .replace(/<SourceRepo>([\s\S]*?)<\/SourceRepo>/g, `[$1](${brand.sourceUrl})`)
      .replace(/<SourceRepo\s*\/>/g, `[the code on GitHub](${brand.sourceUrl})`)
      // Self-closing components: plan facts become their values, the rest disappear.
      .replace(/<([A-Z]\w*)\b([^>]*?)\/>/g, (_m, name: string, attrs: string) => {
        return planFact(name, parseAttrs(attrs)) ?? "";
      })
      // Opening tags: a title becomes a bold line, otherwise the tag goes.
      .replace(/<([A-Z]\w*)\b([^>]*)>/g, (_m, name: string, attrs: string) => {
        const a = parseAttrs(attrs);
        const title = a.title ?? a.value;
        if (name === "InSimpleDash") return `**${title ?? "See it in SimpleDash"}**`;
        return TITLED.has(name) && title ? `**${title}**` : "";
      })
      .replace(/<\/[A-Z]\w*>/g, "")
      // Leftover blank lines from removed tags.
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^[\s\S]*$/, dedent)
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"
  );
}
