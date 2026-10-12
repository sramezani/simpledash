# Backups

The database is backed up every night to Cloudflare R2 (docs/SPEC.md section 20). This file says how it is set up and how to restore a copy.

## What is backed up

- `scripts/backup/backup.sh` runs `pg_dump` in custom format, then gzips it, then uploads it with rclone to `r2:<bucket>/postgres/simpledash-<date>.dump.gz`.
- Only our two schemas, `public` and `drizzle` (the migration log). Supabase's own schemas (auth, storage, vault and so on) are left out: we don't use them, and they can't be restored into a plain Postgres.
- The rows of `report_cache` are left out. They are short-lived copies of GA4 numbers and refill on their own.
- The rows of `session` and `verification` are left out too: session tokens are stored as they are, so a stolen backup could sign someone in. After a restore, everyone signs in again. The tables themselves are kept.
- A dump smaller than 1 KB counts as a failure and isn't uploaded.
- The Google tokens in `account` are encrypted with `BETTER_AUTH_SECRET`, which is not in the backup. Keep that secret safe as well (in a password manager): a restore with a different secret works, but every user then has to reconnect Google.

## Set it up (once)

### 1. R2 bucket

1. Cloudflare → R2 → **Create bucket**: `simpledash-backups`, location hint **Western Europe (WEUR)**.
2. The bucket → Settings → **Object lifecycle rules** → Add rule: delete objects with prefix `postgres/` **30 days** after upload.
3. R2 → **Manage API tokens** → Create API token: permission **Object Read & Write**, only for `simpledash-backups`. Copy the **Access Key ID** and the **Secret Access Key**. The account ID is in the S3 endpoint, `https://<account-id>.r2.cloudflarestorage.com`.

### 2. The backup service in Coolify

1. Coolify → the project → New → **Application** → the same GitHub repo, branch `main`.
2. **Build pack:** Dockerfile. **Base directory:** `/scripts/backup`. **Dockerfile:** `Dockerfile`. No domain, no port.
3. **Environment variables:**

   | Name | Value |
   | --- | --- |
   | `BACKUP_DATABASE_URL` | The same Supabase session pooler URL as the app's `DATABASE_URL` |
   | `R2_ACCOUNT_ID` | Your Cloudflare account ID (the part before `.r2.cloudflarestorage.com`) |
   | `R2_ACCESS_KEY_ID` | From the R2 token |
   | `R2_SECRET_ACCESS_KEY` | From the R2 token |
   | `R2_BUCKET` | `simpledash-backups` |

4. Deploy. The container just waits (`sleep infinity`).
5. **Scheduled tasks** → Add: name `backup`, command `backup.sh`, schedule `0 2 * * *` (02:00 UTC every night).
6. Run the task once by hand and check that a file appears in the bucket.

**Check:** the bucket has a `postgres/simpledash-<date>.dump.gz` file of a few kilobytes or more.

## Restore a copy

Into the local Postgres from `compose.yaml` (or any empty Postgres 17):

```bash
# Download it from the bucket in the Cloudflare dashboard (R2 → simpledash-backups → postgres/),
# or with rclone set up for R2: rclone copy r2:simpledash-backups/postgres/<file> .
gunzip simpledash-2026-10-12T0200Z.dump.gz
export PGPASSWORD=simpledash   # the local database from compose.yaml
docker compose up -d db
createdb -h localhost -U simpledash simpledash_restore
pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
  -h localhost -U simpledash -d simpledash_restore simpledash-2026-10-12T0200Z.dump
DATABASE_URL=postgres://simpledash:simpledash@localhost:5432/simpledash_restore npm run db:migrate
```

`--clean --if-exists` is needed because the dump creates the `public` schema, which a new database already has. The last line should print `migrate: database is up to date`.

To restore into production after a disaster: create a new Supabase project, restore into it the same way with its session pooler URL, then change `DATABASE_URL` (app) and `BACKUP_DATABASE_URL` (backup service) in Coolify and redeploy. The report caches refill on the first dashboard visits.

## Restore test

Done on Oct 12, 2026, without Docker: `backup.sh --local <folder>` dumped the Supabase database (4.8 KB with no users yet), and the dump was restored into a throwaway Postgres 17.11 cluster with the commands above. All 12 tables, their indexes and the 4 migrations came back, and `scripts/migrate.mjs` reported the copy as up to date. Repeat the test once real users exist, with a dump downloaded from R2.
