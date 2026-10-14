# Backups

The database is backed up every night to Cloudflare R2 (docs/SPEC.md section 20). This file says how it is set up and how to restore a copy.

## What is backed up

- `scripts/backup/backup.sh` runs `pg_dump` in custom format, then gzips it, then uploads it with rclone to `r2:<bucket>/postgres/simpledash-<date>.dump.gz`.
- It runs every night at 02:00 UTC in the `backup` container on the server (cron calls `simpledash backup`, `deploy/crontab`).
- Only our two schemas, `public` and `drizzle` (the migration log).
- The rows of `report_cache` are left out. They are short-lived copies of GA4 numbers and refill on their own.
- The rows of `session` and `verification` are left out too: session tokens are stored as they are, so a stolen backup could sign someone in. After a restore, everyone signs in again. The tables themselves are kept.
- A dump smaller than 1 KB counts as a failure and isn't uploaded.
- The Google tokens in `account` and the Stripe keys in `revenue_source` are encrypted with `BETTER_AUTH_SECRET`, which is not in the backup. It is in `deploy/secrets/app.env`: keep that file in a password manager. A restore with a different secret works, but every user then has to reconnect Google and Stripe.

## Set it up (once)

1. Cloudflare → R2 → **Create bucket**: `simpledash-backups`, location hint **Western Europe (WEUR)**.
2. The bucket → Settings → **Object lifecycle rules** → Add rule: delete objects with prefix `postgres/` **30 days** after upload.
3. R2 → **Manage API tokens** → Create API token: permission **Object Read & Write**, only for `simpledash-backups`. Copy the **Access Key ID** and the **Secret Access Key**. The account ID is in the S3 endpoint, `https://<account-id>.r2.cloudflarestorage.com`.
4. Put them in `deploy/secrets/app.env`:

   | Name | Value |
   | --- | --- |
   | `R2_ACCOUNT_ID` | Your Cloudflare account ID (the part before `.r2.cloudflarestorage.com`) |
   | `R2_ACCESS_KEY_ID` | From the R2 token |
   | `R2_SECRET_ACCESS_KEY` | From the R2 token |
   | `R2_BUCKET` | `simpledash-backups` |

5. Run `deploy/setup.sh azureuser@<ip>` (again). `BACKUP_DATABASE_URL` is set by `deploy/compose.yaml`; it isn't in `app.env`.
6. On the server: `sudo simpledash backup`.

**Check:** the bucket has a `postgres/simpledash-<date>.dump.gz` file of a few kilobytes or more, and `sudo simpledash logs jobs` shows `backup: uploaded …` the next morning.

## Restore

`scripts/backup/restore.sh` takes the newest file in `r2:<bucket>/postgres/` (the names sort by date) and loads it with `pg_restore --clean --if-exists`. It runs in the `backup` container:

- **A new server:** `deploy/setup.sh` runs `simpledash restore --if-empty` before the app starts for the first time. It does nothing if the database already has tables, if R2 isn't set, or if the bucket is still empty.
- **Moving servers:** `deploy/setup.sh <new> --from <old>` stops the old app, runs a backup there first, then restores that one (`docs/deploy.md` step 6).
- **On a running server, after a mistake:** `sudo simpledash restore --force`. It stops the app, replaces the database with the newest backup and starts the app again. Everything since that backup is lost.

After a restore, the app's migrations bring the copy up to date when it starts. The report caches refill on the first dashboard visits.

### Into a local Postgres (to look at a copy)

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

## Restore test

Done on Oct 12, 2026, without Docker: `backup.sh --local <folder>` dumped the Supabase database (4.8 KB with no users yet), and the dump was restored into a throwaway Postgres 17.11 cluster with the commands above. All 12 tables, their indexes and the 4 migrations came back, and `scripts/migrate.mjs` reported the copy as up to date. Repeat the test once real users exist, with a dump downloaded from R2.

Done again on Oct 14, 2026, for `restore.sh`: a dump made with `backup.sh --local` from a migrated database with one user, with rclone replaced by a stand-in that reads a local folder. Restoring into an empty database, `--if-empty` on a database with data (kept), the plain form on a database with data (refused), `--force` (replaced, the extra row gone), no R2 set and an empty bucket all behaved as described, and the newest of two files was the one restored. The migrations then reported the copy as up to date. The real R2 path runs on the first `sudo simpledash backup`.
