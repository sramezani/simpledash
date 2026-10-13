import "server-only";
import { z } from "zod";

/**
 * Environment variables, checked with Zod. This is the only file that reads
 * `process.env`. Every variable is listed and explained in `.env.example`.
 *
 * - At server startup (instrumentation.ts), the whole set is checked, so a bad deploy fails fast.
 * - Reading `env.X` checks only X. A build therefore needs only what static pages read
 *   (APP_URL), not the runtime secrets.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
  DATABASE_URL: z.string().min(1),
  // Sprint 1: sign-in and jobs
  BETTER_AUTH_SECRET: z.string().min(32, "Use 32+ random characters (openssl rand -base64 48)"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(24, "Use a long random value (openssl rand -base64 32)"),
  // Sprint 4: email, payments, errors, admin
  RESEND_API_KEY: z.string().startsWith("re_"),
  EMAIL_FROM: z.string().min(3).default("SimpleDash <hello@simpledash.app>"),
  EMAIL_TOKEN_SECRET: z.string().min(32, "Use 32+ random characters (openssl rand -base64 48)"),
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^(sk|rk)_(test|live)_/, "A Stripe secret key (sk_test_… or sk_live_…)"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PRICE_MONTHLY: z.string().startsWith("price_"),
  STRIPE_PRICE_YEARLY: z.string().startsWith("price_"),
  // Sprint 5: the Growth plan's two prices
  STRIPE_PRICE_GROWTH_MONTHLY: z.string().startsWith("price_"),
  STRIPE_PRICE_GROWTH_YEARLY: z.string().startsWith("price_"),
  /** Stripe Managed Payments (Stripe as merchant of record). On unless set to "false". */
  STRIPE_MANAGED_PAYMENTS: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Optional; an empty value (as copied from .env.example) means "not set".
  SENTRY_DSN: z
    .union([z.literal(""), z.url()])
    .optional()
    .transform((v) => v || undefined),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof schema>;
type Key = keyof Env;

/** Inlined by Next.js at build time, so it is safe to read without the other variables. */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * The dev-only pages (/ui-kit). Off in production, unless a local production build
 * sets SHOW_UI_KIT=1 to run Lighthouse on the previews. Never set it on the server.
 */
export const uiKitEnabled = !isProduction || process.env.SHOW_UI_KIT === "1";

const isKey = (key: PropertyKey): key is Key => typeof key === "string" && key in schema.shape;

const values = new Map<Key, unknown>();

function read<K extends Key>(key: K): Env[K] {
  if (!values.has(key)) {
    const parsed = schema.shape[key].safeParse(process.env[key]);
    if (!parsed.success) {
      throw new Error(`Invalid environment variable ${key}:\n${z.prettifyError(parsed.error)}`);
    }
    values.set(key, parsed.data);
  }
  return values.get(key) as Env[K];
}

/** Checks every variable at once and returns them. */
export function getEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/** Called from instrumentation.ts when the Node.js server starts (not during `next build`). */
export function checkEnvAtStartup() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  getEnv();
}

/** Typed, validated environment. Reading a key validates that key once. */
export const env: Env = new Proxy({} as Env, {
  get: (_target, key) => (isKey(key) ? read(key) : undefined),
  has: (_target, key) => isKey(key),
  ownKeys: () => Object.keys(schema.shape),
  getOwnPropertyDescriptor: (_target, key) =>
    isKey(key) ? { enumerable: true, configurable: true, value: read(key) } : undefined,
});
