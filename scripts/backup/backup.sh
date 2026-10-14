#!/bin/sh
# Nightly database backup (docs/backup.md): pg_dump (custom format) → gzip → Cloudflare R2.
# Needs BACKUP_DATABASE_URL and, to upload, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
# and R2_BUCKET (docs/SPEC.md section 22).
# Pass --local <dir> to write the file to a folder instead of uploading it (for restore tests).
set -eu
# A failing pg_dump must fail the backup, not hide behind gzip's exit status.
set -o pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is not set}"

stamp=$(date -u +%Y-%m-%dT%H%MZ)
name="simpledash-$stamp.dump.gz"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Custom format without its own compression, then gzip: one compressed file, easy to check.
# Only our two schemas. Left out: report cache rows (they refill from GA4),
# and sessions and sign-in leftovers (live tokens; after a restore people sign in again).
pg_dump --format=custom --compress=0 --no-owner --no-privileges \
  --schema=public --schema=drizzle \
  --exclude-table-data=report_cache --exclude-table-data=session --exclude-table-data=verification \
  "$BACKUP_DATABASE_URL" | gzip -9 > "$work/$name"

# An empty or tiny file means something went wrong even if pg_dump exited 0.
size=$(wc -c < "$work/$name" | tr -d " ")
if [ "$size" -lt 1024 ]; then
  echo "backup: dump is only $size bytes, not uploading" >&2
  exit 1
fi

if [ "${1:-}" = "--local" ]; then
  cp "$work/$name" "${2:?folder}/$name"
  echo "backup: wrote ${2}/$name ($size bytes)"
  exit 0
fi

. "$(dirname "$0")/r2.sh"
rclone copyto "$work/$name" "r2:$R2_BUCKET/postgres/$name" --s3-no-check-bucket
echo "backup: uploaded postgres/$name ($size bytes)"
