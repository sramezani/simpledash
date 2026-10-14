#!/bin/sh
# Shared by backup.sh and restore.sh: points rclone's "r2" remote at the bucket
# (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET, docs/SPEC.md section 22).
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is not set}" "${R2_BUCKET:?R2_BUCKET is not set}"
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is not set}"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is not set}"
export RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
