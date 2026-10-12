import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Checks `Authorization: Bearer <CRON_SECRET>` in constant time. */
export function isJobRequestAllowed(authorization: string | null): boolean {
  if (!authorization?.startsWith("Bearer ")) return false;
  return timingSafeEqual(digest(authorization.slice(7)), digest(env.CRON_SECRET));
}
