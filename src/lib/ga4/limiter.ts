/**
 * In-process protection for each GA4 property (docs/SPEC.md section 10.4).
 * One server process, so memory is enough. Move to Postgres if we ever run several.
 *
 * - At most 5 GA4 requests at once per property (Google allows 10).
 * - A breaker opens after 5 server errors in an hour, because Google blocks a
 *   project and property pair after 10.
 * - When the hourly token quota runs low, background refreshes are skipped.
 */

const MAX_CONCURRENT = 5;
const BREAKER_LIMIT = 5;
const HOUR = 60 * 60 * 1000;

const running = new Map<string, number>();
const waiting = new Map<string, (() => void)[]>();
const serverErrors = new Map<string, number[]>();
const lowQuotaUntil = new Map<string, number>();

export async function withPropertySlot<T>(propertyId: string, task: () => Promise<T>): Promise<T> {
  if ((running.get(propertyId) ?? 0) >= MAX_CONCURRENT) {
    // Wait for a finishing task to hand its slot over (the count doesn't change).
    await new Promise<void>((resolve) => {
      const queue = waiting.get(propertyId) ?? [];
      queue.push(resolve);
      waiting.set(propertyId, queue);
    });
  } else {
    running.set(propertyId, (running.get(propertyId) ?? 0) + 1);
  }
  try {
    return await task();
  } finally {
    const queue = waiting.get(propertyId);
    const next = queue?.shift();
    if (queue?.length === 0) waiting.delete(propertyId);
    if (next) {
      next();
    } else {
      const left = (running.get(propertyId) ?? 1) - 1;
      if (left === 0) running.delete(propertyId);
      else running.set(propertyId, left);
    }
  }
}

export function recordServerError(propertyId: string, now: number = Date.now()) {
  const recent = (serverErrors.get(propertyId) ?? []).filter((t) => now - t < HOUR);
  recent.push(now);
  serverErrors.set(propertyId, recent);
}

export function isBreakerOpen(propertyId: string, now: number = Date.now()): boolean {
  const recent = (serverErrors.get(propertyId) ?? []).filter((t) => now - t < HOUR);
  if (recent.length === 0) serverErrors.delete(propertyId);
  else serverErrors.set(propertyId, recent);
  return recent.length >= BREAKER_LIMIT;
}

type Quota = {
  tokensPerHour?: { consumed?: number | null; remaining?: number | null } | null;
} | null;

/** Notes what GA4 said is left of the hourly token quota. */
export function recordQuota(
  propertyId: string,
  quota: Quota | undefined,
  now: number = Date.now(),
) {
  const consumed = Number(quota?.tokensPerHour?.consumed ?? 0);
  const remaining = Number(quota?.tokensPerHour?.remaining ?? NaN);
  if (!Number.isFinite(remaining)) return;
  const total = consumed + remaining;
  if (total > 0 && remaining / total < 0.1) {
    const nextHour = new Date(now);
    nextHour.setUTCMinutes(0, 0, 0);
    lowQuotaUntil.set(propertyId, nextHour.getTime() + HOUR);
  }
}

export function isQuotaLow(propertyId: string, now: number = Date.now()): boolean {
  const until = lowQuotaUntil.get(propertyId);
  if (until === undefined) return false;
  if (now >= until) {
    lowQuotaUntil.delete(propertyId);
    return false;
  }
  return true;
}

/** For tests. */
export function resetLimiter() {
  running.clear();
  waiting.clear();
  serverErrors.clear();
  lowQuotaUntil.clear();
}
