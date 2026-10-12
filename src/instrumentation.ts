import type { Instrumentation } from "next";

/** Runs once when the server starts: checks the environment, then starts Sentry (server only). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkEnvAtStartup, env } = await import("@/lib/env");
  checkEnvAtStartup();
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { initSentry } = await import("@/lib/sentry");
  initSentry(env.SENTRY_DSN);
}

/** Errors thrown while rendering pages, route handlers and server actions go to Sentry. */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(...args);
};
