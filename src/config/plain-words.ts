/**
 * GA4's words next to SimpleDash's plain words (the table in CLAUDE.md). The docs page
 * "Plain words" and the glossary read it, so the screen and the docs say the same thing.
 */
export const plainWords = [
  { screen: "Visitors", ga4: "Active users (activeUsers)" },
  { screen: "Page views", ga4: "Views (screenPageViews)" },
  { screen: "Avg. time", ga4: "User engagement duration ÷ active users" },
  { screen: "Signups", ga4: "Event count of the key event you choose" },
  { screen: "Sources", ga4: "Session source (sessionSource)" },
  { screen: "Channels", ga4: "Session default channel group (sessionDefaultChannelGroup)" },
  { screen: "Pages", ga4: "Page path (pagePath)" },
  { screen: "Landing pages", ga4: "Landing page (landingPage)" },
  { screen: "Countries and cities", ga4: "Country and city (country, countryId, city)" },
  { screen: "Devices", ga4: "Device category, browser and operating system" },
  { screen: "Actions", ga4: "Event count by event name (eventCount by eventName)" },
  { screen: "Right now", ga4: "Realtime active users, last 30 minutes" },
  { screen: "Clicks", ga4: "Search Console clicks" },
  { screen: "Seen", ga4: "Search Console impressions" },
  { screen: "Click rate", ga4: "Search Console CTR" },
  { screen: "Position", ga4: "Search Console average position" },
  { screen: "Searches", ga4: "Search Console queries" },
] as const;
