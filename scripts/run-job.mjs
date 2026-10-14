// Runs a scheduled job inside the app container (docs/SPEC.md section 20).
// Cron on the server runs it through `simpledash job <job>` (deploy/crontab):
// node scripts/run-job.mjs <warm-cache|weekly-email|revenue-sync|cleanup>
const job = process.argv[2];
const secret = process.env.CRON_SECRET;
const port = process.env.PORT ?? "3000";

if (!job || !/^[a-z-]+$/.test(job)) {
  console.error("usage: node scripts/run-job.mjs <job>");
  process.exit(2);
}
if (!secret) {
  console.error("run-job: CRON_SECRET is not set");
  process.exit(2);
}

try {
  const response = await fetch(`http://127.0.0.1:${port}/api/internal/jobs/${job}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(15 * 60 * 1000),
  });
  const body = await response.text();
  console.log(`run-job ${job}: ${response.status} ${body}`);
  process.exitCode = response.ok ? 0 : 1;
} catch (error) {
  console.error(`run-job ${job}: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
