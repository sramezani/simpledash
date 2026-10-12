import * as Sentry from "@sentry/nextjs";
import { connection } from "next/server";
import { cleanupJob } from "@/lib/jobs/cleanup";
import { isJobRequestAllowed } from "@/lib/jobs/auth";
import { warmCacheJob } from "@/lib/jobs/warm-cache";
import { weeklyEmailJob } from "@/lib/jobs/weekly-email";
import { reportError } from "@/lib/report-error";

const jobs: Record<string, () => Promise<Record<string, number>>> = {
  "warm-cache": () => warmCacheJob(),
  cleanup: () => cleanupJob(),
  // Sentry's cron monitor notices when the Monday email job stops running or fails.
  "weekly-email": () =>
    Sentry.withMonitor("weekly-email", () => weeklyEmailJob(), {
      schedule: { type: "crontab", value: "0 * * * *" },
      checkinMargin: 10,
      maxRuntime: 30,
      timezone: "Etc/UTC",
    }),
};

/** Scheduled jobs (docs/SPEC.md section 20). Needs `Authorization: Bearer <CRON_SECRET>`. */
export async function POST(request: Request, ctx: RouteContext<"/api/internal/jobs/[job]">) {
  await connection();
  if (!isJobRequestAllowed(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { job } = await ctx.params;
  const run = Object.hasOwn(jobs, job) ? jobs[job] : undefined;
  if (!run) return Response.json({ error: "unknown job" }, { status: 404 });
  const started = Date.now();
  try {
    const result = await run();
    return Response.json({ job, ok: true, ms: Date.now() - started, ...result });
  } catch (error) {
    reportError(`Job ${job} failed`, error, { job });
    return Response.json({ job, ok: false }, { status: 500 });
  }
}
