# The backup helper container (docs/backup.md). Postgres 17 client tools plus rclone.
# Cron runs `backup.sh` in it every night and setup runs `restore.sh`; the container itself just waits.
FROM postgres:17-alpine
RUN apk add --no-cache rclone tzdata
COPY backup.sh restore.sh r2.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh
ENV RCLONE_CONFIG_R2_TYPE=s3 \
    RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
    RCLONE_CONFIG_R2_ACL=private \
    RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
USER postgres
ENTRYPOINT []
CMD ["sleep", "infinity"]
