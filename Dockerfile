# SimpleDash production image (docs/SPEC.md section 21): Next.js standalone output on Node 24.

# ── 1. deps: install every package (dev ones are needed for the build) ──
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ── 2. build: next build (standalone) ──
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# APP_URL is read at build time for canonical URLs and metadata on static pages.
ARG APP_URL=https://simpledash.app
# Public, written into the browser code: SimpleDash's own Google Analytics ID (empty: none).
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID=""
ENV APP_URL=$APP_URL \
    NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. runner: small image, non-root ──
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/scripts ./scripts
# The migration script needs the full packages; the standalone trace only keeps what pages use.
COPY --from=deps --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=node:node /app/node_modules/postgres ./node_modules/postgres

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
