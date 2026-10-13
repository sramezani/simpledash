/**
 * Which icon in public/icons/tech each browser, operating system and device gets
 * (docs/SPEC.md section 11.8). The files are copied by scripts/copy-tech-icons.mjs;
 * a name that isn't here shows a plain fallback icon. Keys are GA4's own values.
 */

export const browserIcons: Readonly<Record<string, string>> = {
  Chrome: "chrome",
  "Chrome WebView": "chrome",
  Safari: "safari",
  "Safari (in-app)": "safari",
  Edge: "edge",
  Firefox: "firefox",
  Opera: "opera",
  "Opera Mini": "opera",
  Brave: "brave",
  Vivaldi: "vivaldi",
  Instagram: "instagram",
  Facebook: "facebook",
  LinkedIn: "linkedin",
  Twitter: "x",
  DuckDuckGo: "duckduckgo",
  "Android Webview": "android",
  "Android Browser": "android",
};

export const systemIcons: Readonly<Record<string, string>> = {
  Macintosh: "apple",
  iOS: "apple",
  iPadOS: "apple",
  Windows: "windows",
  "Windows Phone": "windows",
  Android: "android",
  Linux: "linux",
  Ubuntu: "ubuntu",
  Debian: "debian",
  Fedora: "fedora",
  "Chrome OS": "chrome",
};

export const deviceIcons: Readonly<Record<string, string>> = {
  desktop: "desktop",
  mobile: "mobile",
  tablet: "tablet",
};
