/**
 * When the Monday email goes out (docs/SPEC.md section 14). Pure, so it is tested.
 * It is sent on Monday from 13:00 in the site's time zone, after GA4's usual
 * processing of Sunday. The hourly job retries until 17:59 if a send failed.
 */

const SEND_FROM_HOUR = 13;
const SEND_UNTIL_HOUR = 17;

/** Weekday (0 = Sunday) and hour in a time zone. */
export function localTime(now: Date, timeZone: string): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.find((p) => p.type === "weekday")?.value ?? "",
  );
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? -1);
  return { weekday, hour };
}

/** True on Monday between 13:00 and 17:59 in the site's time zone. */
export function isSendTime(now: Date, timeZone: string): boolean {
  const { weekday, hour } = localTime(now, timeZone);
  return weekday === 1 && hour >= SEND_FROM_HOUR && hour <= SEND_UNTIL_HOUR;
}

/** The last hour the email is tried in: after it, a site Google couldn't answer for is left out. */
export function isLastSendHour(now: Date, timeZone: string): boolean {
  return localTime(now, timeZone).hour === SEND_UNTIL_HOUR;
}
