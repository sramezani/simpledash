import type { ReactNode } from "react";
import { plainWords } from "@/config/plain-words";
import { brand } from "@/config/theme";
import { ANALYTICS_SCOPE, SEARCH_CONSOLE_SCOPE } from "@/lib/auth/scopes";
import { durationWords, FRESHNESS, LIVE_REFRESH, type FreshnessKind } from "@/lib/ga4/freshness";

/**
 * Facts the code owns, shown inside content (docs/SPEC.md section 30): how fresh numbers
 * are, which Google scopes we ask for, and the plain-words table. Never typed by hand.
 */

/** "30 minutes": how long a cached report counts as fresh. */
export function Freshness({
  kind,
  audience,
}: {
  kind: FreshnessKind;
  audience: "owner" | "public";
}) {
  return <>{durationWords(FRESHNESS[kind][audience])}</>;
}

/** "20 seconds": how often the live count and the live view update. */
export function LiveRefresh() {
  return <>{durationWords(LIVE_REFRESH)}</>;
}

/** The exact Google scope, as Google's consent screen and docs name it. */
export function Scope({ name }: { name: "analytics" | "search-console" }) {
  return <code>{name === "analytics" ? ANALYTICS_SCOPE : SEARCH_CONSOLE_SCOPE}</code>;
}

/** SimpleDash's word for each GA4 or Search Console term. */
export function PlainWordsTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>In SimpleDash</th>
          <th>In Google Analytics or Search Console</th>
        </tr>
      </thead>
      <tbody>
        {plainWords.map((row) => (
          <tr key={row.screen}>
            <td>{row.screen}</td>
            <td>{row.ga4}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Our support address, from the theme file. */
export function SupportEmail() {
  return <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>;
}

/** The open-source code on GitHub, from the theme file. */
export function SourceRepo({ children }: { children?: ReactNode }) {
  return <a href={brand.sourceUrl}>{children ?? "the code on GitHub"}</a>;
}
