# Deploy: one server, Docker Compose, Cloudflare

Step by step, for Siamak. The plan behind it is in `docs/SPEC.md` section 21.

**How it works:**

- `deploy/setup.sh` turns a fresh Ubuntu or Debian server into a SimpleDash server with **one command**, run on the Mac. Run it again any time: it is safe to repeat.
- Every merge to `main` deploys on its own: GitHub Actions checks the code, builds the image and sends it to the server (`.github/workflows/deploy.yml`).
- The server runs three containers from `deploy/compose.yaml` (the app, Postgres 17 and a small backup helper), plus one HTTPS proxy (Caddy) in `/opt/proxy` that every site on the server shares. Cron on the server runs the scheduled jobs and the nightly backup to Cloudflare R2.
- Moving to a new server is the same command with `--from <old server>`.

Nothing here costs money beyond the server: GitHub Actions (2,000 minutes a month on a private repo), Cloudflare and R2 (10 GB) are free at this size.

| Where | What lives there |
| --- | --- |
| Your Mac, `deploy/secrets/` (git-ignored) | `app.env` (every setting and secret), the Cloudflare Origin Certificate, the deploy key, an optional Cloudflare token. **Keep a copy in your password manager**: without `BETTER_AUTH_SECRET`, a restored backup can't read the stored Google and Stripe tokens |
| GitHub → Settings → Secrets and variables → Actions | Only how to reach the server: `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` and the variable `DEPLOY_PLATFORM`. `setup.sh` sets them. No app secrets |
| The server, `/opt/simpledash` | A copy of `app.env` (as `.env`), the compose file, the site block template, the backup helper and the `simpledash` command. The certificate is in `/opt/proxy/certs/simpledash/` |
| Cloudflare R2 | The nightly database backups (`docs/backup.md`) |

## 1. Cloudflare (once)

1. Add `simpledash.app` to Cloudflare and switch the nameservers at your registrar.
2. **DNS:** an `A` record `simpledash.app` → the server's IP, **proxied** (orange cloud), and `www` as a CNAME to `simpledash.app`, proxied. With a Cloudflare token (step 4), `setup.sh` does this for you.
3. **SSL/TLS → Overview:** **Full (strict)**.
4. **SSL/TLS → Edge Certificates:** turn on **Always Use HTTPS** and **HSTS** (max-age 6 months, include subdomains, no preload at first).
5. **SSL/TLS → Origin Server → Create Certificate:** RSA, hostnames `simpledash.app` and `*.simpledash.app`, 15 years. Save the certificate as `deploy/secrets/origin.pem` and the private key as `deploy/secrets/origin-key.pem`. Nothing ever renews: no certbot.
6. **Rules:**
   - **Cache rule:** cache everything for `/`, `/privacy`, `/terms`, `/p/*`, `/demo`, `/_next/static/*`, `/flags/*` and `/api/icon/*`, respecting the origin's cache headers. (Cloudflare doesn't cache paths like `/api/icon/google.com` unless a rule says so; the icons are sent with a 30-day cache header.) Public pages send `Cache-Control: public, s-maxage=600`, so Cloudflare keeps each one about 10 minutes. Leave `/api/p/<slug>/live` out.
   - **WAF custom rule:** block requests where the URI path starts with `/api/internal/`. (The proxy refuses them too; the jobs run inside the app container.)
   - **Rate limiting rule** (the free plan has one): for `/api/`, for example 100 requests per 10 seconds per IP, then block for 10 seconds.
7. **Email Routing:** `hello@simpledash.app` → your inbox.

## 2. R2 for backups (once)

Create the bucket, its 30-day delete rule and an API token as in `docs/backup.md`, then put the four `R2_…` values in `deploy/secrets/app.env`. Without them the server runs, but there are no backups and nothing to restore when moving.

## 3. A server

Any provider works (today: Azure). What it needs:

- **Ubuntu 24.04 LTS** (or Debian 12), x86 or ARM.
- **2 vCPU and 2–4 GB RAM.** Builds happen on GitHub, so the server only runs the app; setup adds 2 GB of swap.
- **Your SSH key** for an admin user that can use `sudo` (on Azure that's `azureuser`).
- **Inbound ports** in the provider's firewall: **22, 80 and 443, from Any**. GitHub Actions deploys over SSH from addresses that change all the time, so port 22 can't be limited to your IP. It's protected instead by keys only (setup turns password login off) and fail2ban (5 failed logins block that IP for an hour). GitHub's key can only run `simpledash deploy`.
  - Azure: the VM → **Networking** → **Add inbound port rule** for 80 and 443 (the network security group). The server's own firewall (`ufw`) is set up by `setup.sh`, but Azure's comes first.
  - Hetzner: **Firewalls**.

## 4. Run the setup (one command)

On the Mac, in the repo:

```bash
deploy/setup.sh azureuser@<server-ip>
```

One run does everything:

1. **GitHub CLI:** installs it with Homebrew if it's missing, and opens the GitHub sign-in if you're not signed in.
2. **Secrets:** the first time, it builds `deploy/secrets/app.env` from `.env.example`. `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `CRON_SECRET` and `EMAIL_TOKEN_SECRET` get new random values, and the service keys are copied from your local `.env`. `DATABASE_URL` and `BACKUP_DATABASE_URL` aren't in it: compose builds both from `POSTGRES_PASSWORD`.
3. **Asks for anything missing**, with where to find it. That includes `STRIPE_WEBHOOK_SECRET` (the signing secret of the endpoint `https://simpledash.app/api/stripe/webhook`, not the one from `stripe listen`) and the two Cloudflare Origin Certificate parts from step 1, which you paste in.
4. Copies the files to the server, updates the system (`apt upgrade`, automatic security updates on), sets the clock to UTC, adds swap, installs Docker, turns on the firewall (SSH, 80, 443) and creates the `simpledash` user. GitHub's deploy key can only run `simpledash deploy` as that user: no shell.
5. Starts Postgres and the backup helper, sets up the shared HTTPS proxy (or adds this site to it), and restores the newest backup from R2, but only into an empty database.
6. Sets the GitHub secrets and the variable `DEPLOY_PLATFORM`, runs the first deploy and waits for it (about 5 minutes).
7. Checks that the server answers on port 443, and points the DNS at it if `deploy/secrets/cloudflare.env` has a token (Cloudflare → My Profile → API Tokens → "Edit zone DNS" for `simpledash.app`).

Keep `deploy/secrets/` in your password manager.

The `.github/workflows/deploy.yml` file must be on GitHub's `main` before step 4 can deploy. If it isn't yet, setup says so, and the first push to `main` deploys.

**Check:** `curl https://simpledash.app/api/health` returns `{"status":"ok"}`, and the home page loads over HTTPS.

**To change a setting later** (a new Stripe key, `ADMIN_EMAILS`, …): edit `deploy/secrets/app.env` and run `deploy/setup.sh azureuser@<ip>` again. The app restarts with the new values; data stays.

**A new variable in `.env.example`** (a new feature needs one): the next `deploy/setup.sh` run adds it to `app.env` and asks for it if it's required. Deploys from GitHub don't carry secrets, so they only warn: `simpledash deploy` prints the names missing from the server's `.env`, and if the app can't start without them, the health check fails and the server stays on the previous version. Run `deploy/setup.sh` once after adding one. Never change `POSTGRES_PASSWORD` after the first setup: Postgres keeps the password it started with.

## 5. Every deploy (automatic)

A merge or push to `main` runs **Deploy** in GitHub Actions:

1. `npm ci` and `npm run check` (typecheck, lint, tests). Pull requests run only this part.
2. Builds the `Dockerfile` for the server's CPU, with a build cache.
3. Sends the image and the files from `deploy/` and `scripts/backup/` to the server over SSH.
4. On the server, `simpledash deploy` starts the new version. The container runs the database migrations first (`scripts/migrate.mjs`: only the ones the database hasn't had yet, so usually none), then the server. The app's log says which: "applied 1 new migration" or "nothing new". Nobody runs migrations on the server by hand. It waits up to 3 minutes for `/api/health`. If the new version isn't healthy, it goes back to the previous one and the run fails.

To deploy again by hand: GitHub → Actions → **Deploy** → **Run workflow** on `main`.

A migration that already ran stays when it goes back to the previous version, so keep migrations additive (new columns and tables), as they are today.

## 6. Moving to a new server

1. Create the new server as in step 3.
2. Run:
   ```bash
   deploy/setup.sh azureuser@NEW_IP --from azureuser@OLD_IP
   ```
   After the new server is ready, it stops the app on the old one, backs it up to R2, restores that copy on the new one, moves GitHub's deploys to the new server and deploys there.
3. If there's no Cloudflare token, change the `A` record to the new IP in Cloudflare → DNS.
4. Once `https://simpledash.app` works, delete the old server.

The site is down from the moment the old app stops until the first deploy on the new server is done, about 5 to 10 minutes. If the old server is already gone, leave out `--from`: setup restores the last nightly backup. If something fails after the old app stopped, `ssh azureuser@OLD_IP 'sudo simpledash start'` brings the old server back while you look.

## 7. On the server

Log in with `ssh azureuser@<ip>`, then:

| Command | What it does |
| --- | --- |
| `sudo simpledash status` | The containers and the app's health |
| `sudo simpledash logs` | Follow every log; `logs app`, `logs db`, `logs proxy` (the shared Caddy), or `logs jobs` for the scheduled jobs |
| `sudo simpledash job weekly-email` | Run a job now |
| `sudo simpledash backup` | Back up to R2 now |
| `sudo simpledash restore --force` | Replace the database with the newest R2 backup (stops the app meanwhile) |
| `sudo simpledash stop` / `start` | Stop or start the app; Postgres keeps running |

## 8. Scheduled jobs

Cron runs them as the `simpledash` user (`deploy/crontab`, installed by setup and every deploy). Times are UTC. Each one runs `node scripts/run-job.mjs <job>` inside the app container, which calls `/api/internal/jobs/<job>` on localhost with `CRON_SECRET`.

| Job | Schedule (cron, UTC) |
| --- | --- |
| warm-cache | `5 * * * *` |
| weekly-email | `0 * * * *` |
| revenue-sync | `20 * * * *` |
| cleanup | `30 3 * * *` |
| backup | `0 2 * * *` |

**Check:** `sudo simpledash job cleanup` prints `{"job":"cleanup","ok":true,…}`, and `sudo simpledash logs jobs` shows the hourly runs.

## Several sites on one server

Another site can use the same server with its own copy of this setup. Everything SimpleDash owns is named `simpledash`, so a second site, call it `other`, only has to use its own name in the same places:

| Part | SimpleDash | Another site |
| --- | --- | --- |
| Folder | `/opt/simpledash` | `/opt/other` |
| User (GitHub deploys as it; owns the crontab) | `simpledash` | `other` |
| Compose project, volumes, images | `simpledash`, `simpledash_db-data`, `simpledash-app` | `other`, … |
| Command | `/usr/local/bin/simpledash` | its own |
| Name on the `web` network | `simpledash-app` | `other-app` |
| Site block | `/opt/proxy/etc/sites/simpledash.caddy` (its domains only) | `/opt/proxy/etc/sites/other.caddy` |
| Certificate | `/opt/proxy/certs/simpledash/` | `/opt/proxy/certs/other/` |

**Shared, and created only once:** the proxy in `/opt/proxy` (`deploy/proxy`: one Caddy on ports 80 and 443 whose Caddyfile only says `import sites/*.caddy`), the Docker network `web`, the firewall, swap, Docker itself and the system updates. A later site's setup finds them and leaves them as they are; it never overwrites another site's files.

**Safe by design:** a site block the proxy rejects is put back the way it was, so a mistake in one site never takes the others down. Nothing else is published: the apps and databases are only reachable on their own networks. Each site has its own Cloudflare Origin Certificate for its own domain.

## 9. Google OAuth redirect

In Google Cloud → APIs & Services → Credentials → the OAuth Web client, the **Authorised redirect URIs** must include:

- `http://localhost:3000/api/auth/callback/google`
- `https://simpledash.app/api/auth/callback/google`

## 10. Stripe

Full details in `docs/billing.md`. In short, in live mode:

1. Managed Payments approved, and the "SimpleDash Pro" product (SaaS tax code) with two tax-inclusive USD prices: $9 monthly and $90 yearly. Free has no Stripe product.
2. Webhook endpoint `https://simpledash.app/api/stripe/webhook` with `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` and `invoice.payment_failed`. Its signing secret is `STRIPE_WEBHOOK_SECRET`.
3. Customer Portal: invoices, payment method, cancel at period end, and switching between Pro's two prices.
4. In `deploy/secrets/app.env`: `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`. Run `deploy/setup.sh` again.

**Check:** upgrade with a real card on your own account, see the plan in Settings, then refund and cancel it in Stripe.

## 11. Resend

Add `simpledash.app` in Resend and its DNS records in Cloudflare (`docs/email.md`). `RESEND_API_KEY` goes in `app.env`.

**Check:** Resend shows the domain as verified. The first Monday, the email arrives between 13:00 and 14:00 in your site's time zone.

## 12. Sentry

1. Sentry → new project, platform **Next.js**. Put the DSN in `SENTRY_DSN` in `app.env` and run setup again. (Only the server SDK is used: no Sentry wizard, no browser setup.)
2. **Uptime:** Sentry → Uptime → add a monitor for `https://simpledash.app/api/health`, every minute.
3. **Cron:** the `weekly-email` monitor appears on its own after the first run (the job checks in with its schedule).

**Check:** Sentry → Crons lists `weekly-email`, and the uptime monitor is green.

## Local production image

To test the production image on the Mac (needs Docker):

```bash
docker compose --profile app up --build
```

It builds the `Dockerfile` and serves it on `http://localhost:3000` with the local Postgres from `compose.yaml`.
