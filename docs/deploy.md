# Deploy: Hetzner, Coolify, Cloudflare and Supabase

Step by step, for Siamak. The plan behind it is in `docs/SPEC.md` section 21. Nothing here needs code changes: the app is one Docker image built from the `Dockerfile`.

Do the steps in order. Each one ends with a check.

## 1. Supabase (the database)

The project exists. Its pooler host is `aws-0-eu-west-1.pooler.supabase.com`, so it lives in **eu-west-1 (Ireland)**, not Frankfurt as first planned. That's fine: it adds about 25 ms per database round trip from a German server. Moving it later only means a new connection string.

1. In Supabase → Project settings → Database → **Connection string**, pick **Session pooler** (port **5432** on the `*.pooler.supabase.com` host). Not the direct connection (IPv6 only) and not the transaction pooler (port 6543; it breaks prepared statements).
2. If the password has special characters, percent-encode them in the URL (`@` → `%40`, `#` → `%23`, `/` → `%2F`).
3. **Change the database password** to a long random one (Supabase → Database → Reset password), because the current one was shared in a chat. Update `DATABASE_URL` in `.env` and in Coolify afterwards.

**Check:** `npm run db:migrate` locally prints `migrate: database is up to date`.

## 2. Hetzner (the server)

1. Hetzner Cloud → New server:
   - **Location:** Nuremberg or Falkenstein (Germany, closest to the database).
   - **Image:** Ubuntu 24.04 LTS.
   - **Type:** 2 vCPU, 4 GB RAM (for example CX22 or CAX11; check today's price).
   - **SSH key:** add yours. No root password.
   - **Firewall** (Hetzner → Firewalls): inbound TCP 22 from **your IP only**, TCP 80 and 443 from anywhere.
2. Log in: `ssh root@<server-ip>`.
3. Add 4 GB of swap (Next.js builds need memory):
   ```bash
   fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

**Check:** `free -h` shows 4 GB of swap.

## 3. Coolify

1. Install it on the server (official one-liner, as root):
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
2. Open `http://<server-ip>:8000`, create the admin account, and choose "This server" (localhost).
3. Once Cloudflare (step 4) works, give Coolify itself a domain such as `coolify.simpledash.app`, then close port 8000 in the Hetzner firewall.

**Check:** the Coolify dashboard loads and shows the server as reachable.

## 4. Cloudflare

1. Add `simpledash.app` to Cloudflare and switch the nameservers at your registrar.
2. **DNS:** an `A` record `simpledash.app` → server IP, **proxied** (orange cloud). Add `www` as a CNAME to `simpledash.app`, proxied.
3. **SSL/TLS → Overview:** **Full (strict)**.
4. **SSL/TLS → Edge Certificates:** turn on **Always Use HTTPS** and **HSTS** (max-age 6 months, include subdomains, no preload at first).
5. **SSL/TLS → Origin Server → Create Certificate:** RSA, hostnames `simpledash.app` and `*.simpledash.app`, 15 years. Copy the certificate and the private key.
6. Put the Origin Certificate in Coolify's proxy (Traefik):
   - On the server: save the files as `/data/coolify/proxy/certs/simpledash.cert` and `/data/coolify/proxy/certs/simpledash.key`.
   - In Coolify → Servers → your server → Proxy → **Dynamic configurations**, add a file `cloudflare-origin.yaml`:
     ```yaml
     tls:
       certificates:
         - certFile: /traefik/certs/simpledash.cert
           keyFile: /traefik/certs/simpledash.key
     ```
   - Restart the proxy.
7. **Rules** (they matter from Sprint 1 on, but they can be added now):
   - **Cache rule:** cache everything for `/`, `/privacy`, `/terms`, `/p/*`, `/_next/static/*`, `/flags/*` and `/api/icon/*`, respecting the origin's cache headers. (Cloudflare doesn't cache paths like `/api/icon/google.com` unless a rule says so; the icons are sent with a 30-day cache header.)
   - **WAF custom rule:** block requests where the URI path starts with `/api/internal/` (the scheduled tasks call it from inside the container).
   - **Rate limiting rule** (the free plan has one): for `/api/`, for example 100 requests per 10 seconds per IP, then block for 10 seconds.
8. **Email Routing** (Sprint 3): `hello@simpledash.app` → your inbox.

**Check:** `https://simpledash.app` shows Coolify's or Traefik's default 404 with a valid padlock (the certificate is Cloudflare's).

## 5. The app in Coolify

1. Push the repo to GitHub (git is Siamak's).
2. Coolify → Projects → New → **Application** → GitHub (install the Coolify GitHub app on the repo) → branch `main`.
3. **Build pack:** Dockerfile. **Port:** 3000. **Domain:** `https://simpledash.app`.
4. **Environment variables:** every key in `.env.example` that has a value in your `.env`, but with:
   - `APP_URL=https://simpledash.app`, ticked as **Build variable** too (static pages read it at build time).
   - `DATABASE_URL` = the Supabase session pooler URL from step 1.
   - Production keys for Stripe and Google when they exist (test keys are fine until launch).
5. **Health check:** path `/api/health`, port 3000. (The image also has its own `HEALTHCHECK`.)
6. **Auto-deploy** on push to `main`: on.
7. Deploy.

The container runs the database migrations (`scripts/migrate.mjs`) and then starts the server. If the migrations fail, the container stops and Coolify keeps the previous version running.

**Check:** `curl https://simpledash.app/api/health` returns `{"status":"ok"}`, and the home page loads over HTTPS.

## 6. Scheduled tasks (from Sprint 1)

Coolify → the application → **Scheduled tasks**. Each one runs a command inside the app container. The commands call `/api/internal/jobs/<job>` on localhost with `CRON_SECRET`.

| Name | Command | Schedule (cron, UTC) |
| --- | --- | --- |
| warm-cache | `node scripts/run-job.mjs warm-cache` | `5 * * * *` |
| weekly-email | `node scripts/run-job.mjs weekly-email` | `0 * * * *` |
| cleanup | `node scripts/run-job.mjs cleanup` | `30 3 * * *` |

The nightly backup runs in its own small container with its own scheduled task; its setup is in `docs/backup.md`.

**Check:** run each task once with Coolify's "Run now"; the log shows `{"job":"…","ok":true,…}`.

## 7. Google OAuth redirect (Sprint 1)

In Google Cloud → APIs & Services → Credentials → the OAuth Web client, the **Authorised redirect URIs** must include:

- `http://localhost:3000/api/auth/callback/google`
- `https://simpledash.app/api/auth/callback/google`

## 8. Stripe (Sprint 4)

Full details in `docs/billing.md`. In short, in live mode:

1. Managed Payments approved, the "SimpleDash Starter" product (SaaS tax code) with the €9 monthly and €90 yearly prices, both tax inclusive.
2. Webhook endpoint `https://simpledash.app/api/stripe/webhook` with `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` and `invoice.payment_failed`.
3. Customer Portal: invoices, payment method, cancel at period end, and switching between the two prices.
4. In Coolify: `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`. Redeploy.

**Check:** upgrade with a real card on your own account, see "Starter" in Settings, then refund and cancel it in Stripe.

## 9. Resend (Sprint 4)

Add `simpledash.app` in Resend and its DNS records in Cloudflare (`docs/email.md`). Put `RESEND_API_KEY` in Coolify.

**Check:** Resend shows the domain as verified. The first Monday, the email arrives between 13:00 and 14:00 in your site's time zone.

## 10. Sentry (Sprint 4)

1. Sentry → new project, platform **Next.js**. Copy the DSN into `SENTRY_DSN` in Coolify and redeploy. (Only the server SDK is used: no Sentry wizard, no browser setup.)
2. **Uptime:** Sentry → Uptime → add a monitor for `https://simpledash.app/api/health`, every minute.
3. **Cron:** the `weekly-email` monitor appears on its own after the first run (the job checks in with its schedule).

**Check:** Sentry → Crons lists `weekly-email`, and the uptime monitor is green.

## 11. Cloudflare rules for Sprint 4

Nothing new to add. The cache rule from step 4 already covers `/p/*`: public pages send `Cache-Control: public, s-maxage=600`, so Cloudflare keeps each one about 10 minutes. The live numbers at `/api/p/<slug>/live` stay out of the cache rule; the server keeps them 60 seconds.

## Local production image

To test the production image on the Mac (needs Docker):

```bash
docker compose --profile app up --build
```

It builds the `Dockerfile` and serves it on `http://localhost:3000` with the local Postgres from `compose.yaml`.
