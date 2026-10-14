#!/bin/sh
# Restores the newest backup from R2 into BACKUP_DATABASE_URL (docs/backup.md).
#   restore.sh              refuses if the database already has tables
#   restore.sh --if-empty   does nothing if the database already has tables or the bucket is empty
#                           (what `simpledash setup` runs on a new server)
#   restore.sh --force      replaces what's there (the app must be stopped first)
set -eu
set -o pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is not set}"
mode="${1:-}"

tables=$(psql "$BACKUP_DATABASE_URL" -tAc \
  "select count(*) from information_schema.tables where table_schema = 'public'")
if [ "$tables" != "0" ] && [ "$mode" != "--force" ]; then
  if [ "$mode" = "--if-empty" ]; then
    echo "restore: the database already has data, keeping it"
    exit 0
  fi
  echo "restore: the database already has $tables tables; use --force to replace them" >&2
  exit 1
fi

if [ "$mode" = "--if-empty" ] && [ -z "${R2_ACCOUNT_ID:-}" ]; then
  echo "restore: R2 isn't set up, starting with an empty database"
  exit 0
fi
. "$(dirname "$0")/r2.sh"

# Names carry a sortable UTC time (simpledash-2026-10-13T0200Z.dump.gz), so the last one is the newest.
latest=$(rclone lsf "r2:$R2_BUCKET/postgres/" --files-only --include "simpledash-*.dump.gz" | sort | tail -n 1)
if [ -z "$latest" ]; then
  if [ "$mode" = "--if-empty" ]; then
    echo "restore: no backups in the bucket yet, starting with an empty database"
    exit 0
  fi
  echo "restore: no backups in r2:$R2_BUCKET/postgres/" >&2
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
rclone copyto "r2:$R2_BUCKET/postgres/$latest" "$work/$latest"
gunzip -c "$work/$latest" > "$work/restore.dump"

# --clean --if-exists: the dump creates the public schema, which a new database already has.
pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
  -d "$BACKUP_DATABASE_URL" "$work/restore.dump"
echo "restore: restored $latest"
