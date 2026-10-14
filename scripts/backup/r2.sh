#!/bin/sh
# Shared by backup.sh and restore.sh: points rclone's "r2" remote at the bucket
# (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET, docs/SPEC.md section 22).
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is not set}" "${R2_BUCKET:?R2_BUCKET is not set}"
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is not set}"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is not set}"
export RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
# Fail within about a minute with rclone's own error, instead of retrying quietly for many
# minutes when R2 can't be reached or a value above is wrong.
export RCLONE_CONTIMEOUT=15s RCLONE_TIMEOUT=60s RCLONE_RETRIES=2 RCLONE_LOW_LEVEL_RETRIES=2
# Errors only: rclone's "Config file … not found" notice is expected (the remote comes from these
# variables) and must not mix into the file list restore.sh reads.
export RCLONE_LOG_LEVEL=ERROR
