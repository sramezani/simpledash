# The nightly backup container (docs/backup.md). Postgres 17 client tools plus rclone.
# Coolify runs `backup.sh` in it as a scheduled task; the container itself just waits.
FROM postgres:17-alpine
RUN apk add --no-cache rclone tzdata
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh
ENV RCLONE_CONFIG_R2_TYPE=s3 \
    RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
    RCLONE_CONFIG_R2_ACL=private \
    RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
USER postgres
ENTRYPOINT []
CMD ["sleep", "infinity"]
