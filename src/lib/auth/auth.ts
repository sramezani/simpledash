import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { brand } from "@/config/theme";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";
import { lazyObject } from "@/lib/lazy";
import { createUserRows } from "@/lib/billing/billing";
import { reactivateSites } from "@/lib/sites";
import { ANALYTICS_SCOPE } from "./scopes";

const DAY = 60 * 60 * 24;

/** Better Auth: Google sign-in only, with read-only Analytics access (docs/SPEC.md section 6). */
const createAuth = () =>
  betterAuth({
    appName: brand.name,
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        scope: [ANALYTICS_SCOPE],
        accessType: "offline",
        // Google only sends a refresh token on a consent screen, so ask every time.
        prompt: "select_account consent",
      },
    },
    account: {
      encryptOAuthTokens: true,
      updateAccountOnSignIn: true,
    },
    session: {
      expiresIn: 30 * DAY,
      updateAge: DAY,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      useSecureCookies: env.APP_URL.startsWith("https://"),
      // Store as little as possible: no IP addresses on sessions. Only Google's callback is
      // reachable over HTTP, and Cloudflare rate-limits /api/.
      ipAddress: { disableIpTracking: true },
    },
    databaseHooks: {
      user: {
        // Every new account starts a 14-day trial, with the weekly email on.
        create: { after: async (row) => createUserRows(row.id, new Date(row.createdAt)) },
      },
      account: {
        // New Google tokens (sign-in or refresh) mean a "Google access ended" site works again.
        create: { after: async (row) => reactivateFor(row) },
        update: { after: async (row) => reactivateFor(row) },
      },
    },
    plugins: [nextCookies()],
  });

async function reactivateFor(row: { userId?: unknown; providerId?: unknown }) {
  if (row.providerId === "google" && typeof row.userId === "string")
    await reactivateSites(row.userId);
}

/** The Better Auth instance, created on first use. */
export const auth: ReturnType<typeof createAuth> = lazyObject(createAuth);
