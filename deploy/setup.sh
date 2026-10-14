#!/usr/bin/env bash
# Puts SimpleDash on a fresh Ubuntu or Debian server with one command (docs/deploy.md).
# Run it on your Mac, from anywhere in the repo:
#
#   deploy/setup.sh azureuser@<server-ip>
#   deploy/setup.sh -i ~/path/to/key.pem azureuser@<server-ip>      with a key file, like ssh -i
#   deploy/setup.sh azureuser@NEW_IP --from azureuser@OLD_IP    moving servers: the old app stops,
#                                                               its newest data comes along
#
# It updates and secures the server, installs Docker, starts Postgres, the backup helper and the
# shared HTTPS proxy (other sites on the same server keep working: docs/deploy.md),
# restores the newest R2 backup into an empty database, tells GitHub where to deploy, runs the first
# deploy and, with a Cloudflare token, points the DNS at the server. Safe to run again.
# Missing values and the certificate are asked for on the way, so one run is enough.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SECRETS="$ROOT/deploy/secrets"
APP_ENV="$SECRETS/app.env"
CF_ENV="$SECRETS/cloudflare.env"
REQUIRED="APP_URL POSTGRES_PASSWORD BETTER_AUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET CRON_SECRET
RESEND_API_KEY EMAIL_TOKEN_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_PRICE_MONTHLY
STRIPE_PRICE_YEARLY"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die() { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# The value of KEY in an env file (empty if missing).
env_get() { [[ -f $2 ]] && sed -n "s/^$1=//p" "$2" | tail -n 1 || true; }
# Sets KEY=VALUE in an env file, replacing the line or adding it at the end.
env_set() {
  local tmp
  tmp=$(mktemp)
  KEY="$1" VALUE="$2" awk 'BEGIN { k = ENVIRON["KEY"]; v = ENVIRON["VALUE"] }
    index($0, k "=") == 1 { print k "=" v; done = 1; next } { print }
    END { if (!done) print k "=" v }' "$3" > "$tmp"
  cat "$tmp" > "$3"
  rm -f "$tmp"
}
interactive() { [[ -t 0 && -t 1 ]]; }

# The same format rules as src/lib/env.ts, so a typo shows up here, not as an app that won't start.
valid() {
  case $1 in
    APP_URL) [[ $2 =~ ^https:// ]] ;;
    POSTGRES_PASSWORD) [[ $2 =~ ^[A-Za-z0-9]{16,}$ ]] ;;
    BETTER_AUTH_SECRET | EMAIL_TOKEN_SECRET) [[ ${#2} -ge 32 ]] ;;
    CRON_SECRET) [[ ${#2} -ge 24 ]] ;;
    RESEND_API_KEY) [[ $2 == re_* ]] ;;
    STRIPE_SECRET_KEY) [[ $2 =~ ^(sk|rk)_(test|live)_ ]] ;;
    STRIPE_WEBHOOK_SECRET) [[ $2 == whsec_* ]] ;;
    STRIPE_PRICE_*) [[ $2 == price_* ]] ;;
    *) [[ -n $2 ]] ;;
  esac
}

# Where each required value comes from, shown when setup asks for it.
hint() {
  case $1 in
    GOOGLE_CLIENT_*) echo "Google Cloud → APIs & Services → Credentials → the OAuth Web client" ;;
    RESEND_API_KEY) echo "Resend → API Keys (starts with re_)" ;;
    STRIPE_SECRET_KEY) echo "Stripe → Developers → API keys (sk_live_… at launch, sk_test_… before)" ;;
    STRIPE_WEBHOOK_SECRET) echo "Stripe → Developers → Webhooks → the endpoint https://simpledash.app/api/stripe/webhook → Signing secret" ;;
    STRIPE_PRICE_*) echo "Stripe → Product catalog → SimpleDash Pro → the price's ID (price_…)" ;;
    APP_URL) echo "the site's address, https://simpledash.app" ;;
    *) echo "see .env.example" ;;
  esac
}

target="" from="" key_opts=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --from) from=${2:?--from needs user@old-server}; shift 2 ;;
    -i)
      key_file=${2:?-i needs a key file}
      key_file=${key_file/#\~/$HOME}
      [[ -f $key_file ]] || die "no key file at $key_file"
      key_opts=(-i "$key_file" -o IdentitiesOnly=yes)
      shift 2
      ;;
    -h | --help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) die "unknown option $1 (see deploy/setup.sh --help)" ;;
    *) [[ -z $target ]] || die "one server at a time"; target=$1; shift ;;
  esac
done
[[ -n $target ]] || { sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
for tool in ssh ssh-keygen openssl tar curl; do
  command -v "$tool" >/dev/null || die "$tool is missing on this computer"
done
# The GitHub CLI tells GitHub Actions where to deploy: installed and signed in here if needed.
if ! command -v gh >/dev/null; then
  command -v brew >/dev/null || die "Install the GitHub CLI (https://cli.github.com), then run this again"
  say "Installing the GitHub CLI"
  brew install gh
fi
if ! gh auth status >/dev/null 2>&1; then
  interactive || die "Sign in to GitHub first: gh auth login"
  say "Signing in to GitHub"
  gh auth login --hostname github.com --git-protocol https --web
fi
# The real address and port, also when the target is an alias from ~/.ssh/config.
host=$(ssh ${key_opts[@]+"${key_opts[@]}"} -G "$target" | awk '$1 == "hostname" { print $2 }')
[[ $(ssh ${key_opts[@]+"${key_opts[@]}"} -G "$target" | awk '$1 == "port" { print $2 }') == 22 ]] ||
  die "the server's SSH must listen on port 22 (GitHub Actions deploys there)"
cd "$ROOT"

# ── 1. Secrets: they live only here (git-ignored) and on the server ──────────────────────
say "Checking deploy/secrets/"
mkdir -p "$SECRETS"
chmod 700 "$SECRETS"
first_run=false

if [[ ! -f $APP_ENV ]]; then
  # Built from .env.example, so it lists every variable with its explanation. Secrets are new
  # random values; service keys are copied from your local .env as a start.
  while IFS= read -r line || [[ -n $line ]]; do
    if [[ $line =~ ^([A-Z0-9_]+)=(.*)$ ]]; then
      key=${BASH_REMATCH[1]} value=${BASH_REMATCH[2]}
      case $key in
        DATABASE_URL | BACKUP_DATABASE_URL) continue ;; # compose sets both from POSTGRES_PASSWORD
        APP_URL) value=https://simpledash.app ;;
        POSTGRES_PASSWORD | BETTER_AUTH_SECRET | CRON_SECRET | EMAIL_TOKEN_SECRET) value=$(openssl rand -hex 32) ;;
        STRIPE_WEBHOOK_SECRET) value="" ;; # the production endpoint's own secret, not `stripe listen`'s
        *) local_value=$(env_get "$key" "$ROOT/.env"); value=${local_value:-$value} ;;
      esac
      printf '%s=%s\n' "$key" "$value"
    else
      printf '%s\n' "$line"
    fi
  done < "$ROOT/.env.example" > "$APP_ENV"
  chmod 600 "$APP_ENV"
  ok "Created deploy/secrets/app.env (new random secrets, service keys copied from .env)"
  first_run=true
fi

# Variables added to .env.example since app.env was made get a line too (with the example's value).
added=""
while IFS= read -r line || [[ -n $line ]]; do
  [[ $line =~ ^([A-Z0-9_]+)=(.*)$ ]] || continue
  key=${BASH_REMATCH[1]}
  case $key in DATABASE_URL | BACKUP_DATABASE_URL) continue ;; esac
  grep -q "^$key=" "$APP_ENV" || { env_set "$key" "${BASH_REMATCH[2]}" "$APP_ENV"; added="$added $key"; }
done < "$ROOT/.env.example"
[[ -z $added ]] || ok "Added new variables to app.env:$added"

if [[ ! -f $CF_ENV ]]; then
  cat > "$CF_ENV" <<'CONF'
# Optional. With a Cloudflare API token, setup points the DNS at the new server by itself.
# Cloudflare → My Profile → API Tokens → Create Token → "Edit zone DNS", zone simpledash.app.
CLOUDFLARE_API_TOKEN=
CONF
  chmod 600 "$CF_ENV"
fi

if [[ ! -f $SECRETS/deploy-key ]]; then
  ssh-keygen -q -t ed25519 -N "" -C simpledash-deploy -f "$SECRETS/deploy-key"
  ok "Created the deploy key GitHub Actions uses (deploy/secrets/deploy-key)"
fi

# Our own secrets are made here when empty (an app.env written by hand, say).
for key in POSTGRES_PASSWORD BETTER_AUTH_SECRET CRON_SECRET EMAIL_TOKEN_SECRET; do
  if [[ -z $(env_get "$key" "$APP_ENV") ]]; then
    env_set "$key" "$(openssl rand -hex 32)" "$APP_ENV"
    ok "Made a new random $key"
  fi
done

# Anything missing or in the wrong format is asked for here, so one run is enough.
for key in $REQUIRED; do
  value=$(env_get "$key" "$APP_ENV")
  valid "$key" "$value" && continue
  if ! interactive; then
    [[ -n $value ]] && die "$key in deploy/secrets/app.env isn't in the right format"
    die "$key is empty in deploy/secrets/app.env"
  fi
  [[ -z $value ]] || warn "$key doesn't look right ($value)"
  echo "  $key ($(hint "$key"))"
  value=""
  until valid "$key" "$value"; do
    read -r -p "  > " value
  done
  env_set "$key" "$value" "$APP_ENV"
done
[[ $(env_get STRIPE_SECRET_KEY "$APP_ENV") == *_test_* ]] &&
  warn "Stripe is in test mode (a test key): fine for trying it, switch to the live key and prices at launch"
# The Cloudflare Origin Certificate: each file must be what its name says, so a certificate
# can't be saved as the key (or the other way round). A wrong file is removed, not kept.
pem_ok() { # file, expected header
  [[ -s $1 ]] && head -n 1 "$1" | grep -q -- "-----BEGIN $2-----" &&
    grep -q -- "-----END $2-----" "$1"
}
for part in origin.pem:CERTIFICATE:certificate origin-key.pem:PRIVATE\ KEY:"private key (the second box, not the certificate)"; do
  IFS=: read -r file kind what <<< "$part"
  path=$SECRETS/$file
  if [[ -e $path ]] && ! pem_ok "$path" "$kind"; then
    warn "deploy/secrets/$file isn't a $kind (it was removed); paste it again"
    rm -f "$path"
  fi
  pem_ok "$path" "$kind" && continue
  interactive || die "deploy/secrets/$file is missing (docs/deploy.md step 1)"
  echo
  echo "  Paste the Cloudflare Origin Certificate's $what."
  echo "  It starts with -----BEGIN $kind-----"
  echo "  (Cloudflare → SSL/TLS → Origin Server → Create Certificate, for simpledash.app and"
  echo "  *.simpledash.app, 15 years; the private key is only shown once, on that screen)."
  until pem_ok "$path" "$kind"; do
    echo "  Paste it, then press Enter and Control-D:"
    cat > "$path"
    chmod 600 "$path"
    if ! pem_ok "$path" "$kind"; then
      warn "That isn't a $kind: it should start with -----BEGIN $kind-----. Try again (Control-C to stop)."
      rm -f "$path"
      # Control-D ended the paste; the terminal is still usable for the next one.
    fi
  done
  ok "Saved deploy/secrets/$file"
done
$first_run && warn "Keep deploy/secrets/ in your password manager: a new server needs it to read the stored tokens."
r2_id=$(env_get R2_ACCOUNT_ID "$APP_ENV")
if [[ -n $r2_id && ! $r2_id =~ ^[0-9a-f]{32}$ ]]; then
  # A pasted endpoint (https://<id>.r2.cloudflarestorage.com) keeps only the ID.
  fixed=$(printf '%s' "$r2_id" | sed -E 's#^https?://##; s#\.r2\.cloudflarestorage\.com.*##')
  if [[ $fixed =~ ^[0-9a-f]{32}$ ]]; then
    env_set R2_ACCOUNT_ID "$fixed" "$APP_ENV"
    ok "R2_ACCOUNT_ID was the full address; kept only the account ID"
  else
    die "R2_ACCOUNT_ID should be the 32-character account ID (Cloudflare → R2 → Overview), not \"$r2_id\""
  fi
fi
for key in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
  [[ -z $r2_id || -n $(env_get "$key" "$APP_ENV") ]] || die "R2_ACCOUNT_ID is set but $key is empty in deploy/secrets/app.env"
done
if [[ -z $(env_get R2_ACCOUNT_ID "$APP_ENV") ]]; then
  warn "R2 isn't set in app.env: no nightly backups, and nothing to restore (docs/backup.md)"
else
  ok "R2 backups are set"
fi
ok "Secrets complete"

# One SSH connection for every step below (one login, one host-key check).
SSH_OPTS=(${key_opts[@]+"${key_opts[@]}"} -o ConnectTimeout=15 -o ControlMaster=auto -o "ControlPath=/tmp/simpledash-%C" -o ControlPersist=120 -o StrictHostKeyChecking=accept-new)
run() { ssh "${SSH_OPTS[@]}" "$@"; }

# ── 2. The server ─────────────────────────────────────────────────────────────────────────
say "Setting up $target (system updates, Docker, firewall, Postgres, the HTTPS proxy)"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp -R deploy/compose.yaml deploy/caddy deploy/proxy deploy/crontab deploy/simpledash "$stage/"
cp -R scripts/backup "$stage/backup"
cp .env.example "$stage/env.example"
cp "$APP_ENV" "$SECRETS/origin.pem" "$SECRETS/origin-key.pem" "$SECRETS/deploy-key.pub" "$stage/"
COPYFILE_DISABLE=1 tar --no-mac-metadata -cz -C "$stage" . |
  run "$target" 'rm -rf ~/.simpledash-setup && mkdir -m 700 ~/.simpledash-setup && tar -xzf - -C ~/.simpledash-setup 2>/dev/null' ||
  die "couldn't copy the files to $target (can you log in with: ssh $target ?)"
run -t "$target" 'sudo bash ~/.simpledash-setup/simpledash setup ~/.simpledash-setup; s=$?; rm -rf ~/.simpledash-setup; exit $s' ||
  die "the server setup stopped (the reason is above); fix it and run the same command again"

# ── 3. Data ───────────────────────────────────────────────────────────────────────────────
if [[ -n $from ]]; then
  say "Stopping the app on $from and backing it up"
  ssh -t ${key_opts[@]+"${key_opts[@]}"} -o StrictHostKeyChecking=accept-new "$from" 'sudo simpledash stop && sudo simpledash backup' ||
    die "couldn't back up $from; nothing changed on the new server's data, and you can run this again"
fi
say "Restoring the newest backup (only into an empty database)"
run -t "$target" 'sudo simpledash restore --if-empty' || die "the restore failed (the reason is above)"

# ── 4. GitHub: where to deploy, then the first deploy ─────────────────────────────────────
case $(run "$target" uname -m) in
  x86_64) platform=linux/amd64 ;;
  aarch64 | arm64) platform=linux/arm64 ;;
  *) die "unknown server CPU: $(run "$target" uname -m)" ;;
esac
known_hosts=$(run "$target" 'cat /etc/ssh/ssh_host_*_key.pub' | awk -v h="$host" '{ print h, $1, $2 }')

say "Telling GitHub Actions about the server"
if gh auth status >/dev/null 2>&1; then
  gh secret set DEPLOY_HOST --body "$host" >/dev/null
  gh secret set DEPLOY_SSH_KEY < "$SECRETS/deploy-key" >/dev/null
  gh secret set DEPLOY_KNOWN_HOSTS --body "$known_hosts" >/dev/null
  gh variable set DEPLOY_PLATFORM --body "$platform" >/dev/null
  ok "Secrets DEPLOY_HOST, DEPLOY_SSH_KEY, DEPLOY_KNOWN_HOSTS and variable DEPLOY_PLATFORM ($platform) set"

  if run "$target" 'sudo docker image inspect simpledash-app:current >/dev/null 2>&1'; then
    ok "The app is already on this server; the next merge to main deploys a new version"
  else
    say "First deploy: GitHub builds main and sends it to the server (about 5 minutes)"
    # Two minutes early, so a clock that's a little off can't hide the new run.
    started=$(date -u -v-2M +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "2 minutes ago" +%Y-%m-%dT%H:%M:%SZ)
    if gh workflow run deploy.yml --ref main >/dev/null 2>&1; then
      run_id=""
      for _ in $(seq 1 20); do
        run_id=$(gh run list --workflow deploy.yml --event workflow_dispatch --limit 1 \
          --json databaseId,createdAt --jq ".[] | select(.createdAt >= \"$started\") | .databaseId")
        [[ -n $run_id ]] && break
        sleep 3
      done
      [[ -n $run_id ]] || die "the deploy didn't start; see GitHub → Actions"
      gh run watch "$run_id" --exit-status || die "the deploy failed; see GitHub → Actions → Deploy"
    else
      warn "deploy.yml isn't on GitHub's main branch yet. Push it: the deploy then runs on its own."
    fi
  fi
else
  warn "The GitHub CLI isn't signed in (brew install gh; gh auth login). Set these in GitHub →"
  echo "      Settings → Secrets and variables → Actions, then run the Deploy workflow:"
  echo "      secret DEPLOY_HOST = $host"
  echo "      secret DEPLOY_SSH_KEY = the contents of deploy/secrets/deploy-key"
  echo "      secret DEPLOY_KNOWN_HOSTS ="
  printf '%s\n' "$known_hosts" | sed 's/^/        /'
  echo "      variable DEPLOY_PLATFORM = $platform"
fi

# ── 5. Reachable from Cloudflare? Then DNS ────────────────────────────────────────────────
domain=$(env_get APP_URL "$APP_ENV" | sed -E 's#^https?://##; s#[/:].*##')
if [[ $host =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  ip=$host
else
  ip=$(run "$target" 'curl -fsS https://1.1.1.1/cdn-cgi/trace' | sed -n 's/^ip=//p')
fi

say "Checking that the server answers on port 443"
if curl -fsSk --max-time 10 --resolve "$domain:443:$ip" "https://$domain/api/health" >/dev/null 2>&1; then
  ok "https://$ip answers for $domain"
elif run "$target" 'sudo docker image inspect simpledash-app:current >/dev/null 2>&1'; then
  warn "Port 443 isn't reachable from here. Open ports 80 and 443 in your cloud's firewall"
  echo "      (Azure: the VM → Networking → Add inbound port rule; Hetzner: Firewalls)."
else
  warn "The app isn't deployed yet, so this check is skipped"
fi

cf_token=$(env_get CLOUDFLARE_API_TOKEN "$CF_ENV")
if [[ -n $cf_token ]] && command -v jq >/dev/null; then
  say "Pointing $domain at $ip in Cloudflare"
  cf() { curl -fsS -H "Authorization: Bearer $cf_token" -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/$1" "${@:2}"; }
  zone=$(cf "zones?name=$domain" | jq -r '.result[0].id // empty')
  [[ -n $zone ]] || die "Cloudflare has no zone $domain for this token"
  record=$(jq -nc --arg name "$domain" --arg ip "$ip" '{type: "A", name: $name, content: $ip, proxied: true, ttl: 1}')
  existing=$(cf "zones/$zone/dns_records?type=A&name=$domain" | jq -r '.result[0].id // empty')
  if [[ -n $existing ]]; then
    cf "zones/$zone/dns_records/$existing" -X PATCH --data "$record" >/dev/null
  else
    cf "zones/$zone/dns_records" -X POST --data "$record" >/dev/null
  fi
  if [[ $(cf "zones/$zone/dns_records?name=www.$domain" | jq '.result | length') == 0 ]]; then
    cf "zones/$zone/dns_records" -X POST --data \
      "$(jq -nc --arg name "www.$domain" --arg to "$domain" '{type: "CNAME", name: $name, content: $to, proxied: true, ttl: 1}')" >/dev/null
  fi
  ok "DNS: $domain → $ip (proxied)"
else
  say "DNS"
  echo "  In Cloudflare → DNS, the A record $domain must point at $ip, proxied (orange cloud)."
  echo "  (Or add CLOUDFLARE_API_TOKEN to deploy/secrets/cloudflare.env and setup does it.)"
fi

say "Done"
echo "  Site:     https://$domain"
echo "  Server:   ssh $target, then: sudo simpledash status | logs | backup"
echo "  Deploys:  every merge to main (GitHub → Actions → Deploy)"
[[ -z $from ]] || echo "  The app on $from is stopped. Once https://$domain works, delete that server."
