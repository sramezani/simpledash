/** Plain-word labels for GA4 values (docs/SPEC.md sections 10.2 and 11.4). */

/** GA4's placeholder values, in plain words. */
export function plainValue(value: string | null | undefined): string {
  switch (value) {
    case undefined:
    case null:
    case "":
    case "(not set)":
      return "Unknown";
    case "(direct)":
    case "(none)":
      return "Direct";
    case "(other)":
      return "Other";
    default:
      return value;
  }
}

const CHANNELS: Record<string, string> = {
  Direct: "Direct",
  "Organic Search": "Search",
  "Organic Social": "Social",
  Referral: "Other sites",
  Email: "Email",
  "AI Assistant": "AI assistants",
  "Organic Video": "Video",
  "Organic Shopping": "Shopping",
  "Paid Search": "Search ads",
  "Paid Social": "Social ads",
  Display: "Display ads",
  Unassigned: "Unknown",
};

/** GA4 default channel group → plain words. Any other paid channel is "Other ads". */
export function channelLabel(channel: string): string {
  if (CHANNELS[channel]) return CHANNELS[channel];
  if (/paid|cross-network|affiliates|audio|sms|mobile push/i.test(channel)) return "Other ads";
  return plainValue(channel);
}

export type Device = "desktop" | "mobile" | "tablet" | "other";

export function deviceOf(category: string): Device {
  const c = category.toLowerCase();
  return c === "desktop" || c === "mobile" || c === "tablet" ? c : "other";
}

export const DEVICE_LABELS: Record<Device, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  other: "Other",
};

/** GA4 browser names that read better another way. */
const BROWSER_NAMES: Record<string, string> = {
  "Android Webview": "Android WebView",
  "Safari (in-app)": "Safari (in an app)",
  YaBrowser: "Yandex Browser",
  "Mozilla Compatible Agent": "Other",
};

/** The `browser` dimension in plain words: "Chrome", "Safari (in an app)". */
export function browserLabel(browser: string): string {
  return BROWSER_NAMES[browser] ?? plainValue(browser);
}

/** GA4 operating system names that read better another way. */
const SYSTEM_NAMES: Record<string, string> = {
  Macintosh: "macOS",
  "Chrome OS": "ChromeOS",
};

/** The `operatingSystem` dimension in plain words: "macOS", "Windows". */
export function systemLabel(os: string): string {
  return SYSTEM_NAMES[os] ?? plainValue(os);
}

/** Common source names that aren't domains, mapped to the site whose icon to show. */
const SOURCE_DOMAINS: Record<string, string> = {
  google: "google.com",
  bing: "bing.com",
  yahoo: "yahoo.com",
  duckduckgo: "duckduckgo.com",
  baidu: "baidu.com",
  yandex: "yandex.com",
  ecosia: "ecosia.org",
  brave: "search.brave.com",
  "t.co": "x.com",
  twitter: "x.com",
  x: "x.com",
  facebook: "facebook.com",
  "m.facebook.com": "facebook.com",
  "l.facebook.com": "facebook.com",
  "lm.facebook.com": "facebook.com",
  instagram: "instagram.com",
  "l.instagram.com": "instagram.com",
  linkedin: "linkedin.com",
  "lnkd.in": "linkedin.com",
  reddit: "reddit.com",
  youtube: "youtube.com",
  "m.youtube.com": "youtube.com",
  hn: "news.ycombinator.com",
  hackernews: "news.ycombinator.com",
  producthunt: "producthunt.com",
  github: "github.com",
  chatgpt: "chatgpt.com",
  "chatgpt.com": "chatgpt.com",
  perplexity: "perplexity.ai",
  newsletter: "",
};

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** The domain whose icon a source should show, or null for a generic icon. */
export function sourceDomain(source: string): string | null {
  const s = source.trim().toLowerCase();
  if (s in SOURCE_DOMAINS) return SOURCE_DOMAINS[s] || null;
  const host = s.replace(/^www\./, "");
  return DOMAIN_RE.test(host) ? host : null;
}

/** Display name for a source: placeholders in plain words, "google" → "Google". */
export function sourceLabel(source: string): string {
  const plain = plainValue(source);
  if (plain !== source) return plain;
  if (/^[a-z]+$/.test(source) && source.length > 1)
    return source[0]!.toUpperCase() + source.slice(1);
  return source;
}
