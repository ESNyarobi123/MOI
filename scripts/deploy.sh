#!/usr/bin/env bash
# deploy.sh — Full production deploy for MoiDate on Docker + Nginx + Let's Encrypt
# Usage:  bash scripts/deploy.sh [--email your@email.com]
# Run from the project root: /root/moidate/

set -euo pipefail

DOMAIN="moidate.online"
APIS_DOMAIN="apis.moidate.online"
WWW_DOMAIN="www.moidate.online"
EMAIL="${CERTBOT_EMAIL:-admin@moidate.online}"

# Parse --email flag
while [[ $# -gt 0 ]]; do
  case $1 in
    --email) EMAIL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

log()  { echo -e "\n\033[1;32m[deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
err()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

# ── 0. Sanity checks ──────────────────────────────────────────────────────────
[[ -f .env ]]            || err ".env file not found. Copy .env.example → .env and fill in values."
[[ -f docker-compose.yml ]] || err "Run this script from the project root (where docker-compose.yml lives)."

# ── 1. Start Nginx in HTTP-only mode for ACME challenge ───────────────────────
log "Starting Nginx (HTTP-only) for ACME challenge..."

# Use only init.conf temporarily (remove moidate.conf if it exists so SSL blocks don't fail)
if [[ -f nginx/conf.d/moidate.conf ]]; then
  mv nginx/conf.d/moidate.conf nginx/conf.d/moidate.conf.disabled
fi

docker compose up -d nginx

sleep 3

# ── 2. Issue SSL certificates ─────────────────────────────────────────────────
issue_cert() {
  local domain="$1"
  shift
  local extra_domains=("$@")

  local cert_path="./certbot/conf/live/$domain"
  if [[ -d "$cert_path" ]]; then
    log "Certificate for $domain already exists, skipping issuance."
    return
  fi

  log "Issuing certificate for $domain..."

  local san_args=()
  for d in "${extra_domains[@]}"; do
    san_args+=(-d "$d")
  done

  docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$domain" \
    "${san_args[@]}"
}

issue_cert "$DOMAIN" "$WWW_DOMAIN"
issue_cert "$APIS_DOMAIN"

# ── 3. Download recommended SSL options from Let's Encrypt ───────────────────
log "Downloading Nginx SSL options from Let's Encrypt..."
if [[ ! -f ./certbot/conf/options-ssl-nginx.conf ]]; then
  curl -fsSL \
    https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o ./certbot/conf/options-ssl-nginx.conf
fi
if [[ ! -f ./certbot/conf/ssl-dhparams.pem ]]; then
  curl -fsSL \
    https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o ./certbot/conf/ssl-dhparams.pem
fi

# ── 4. Switch to full HTTPS Nginx config ──────────────────────────────────────
log "Activating full HTTPS Nginx config..."
if [[ -f nginx/conf.d/moidate.conf.disabled ]]; then
  mv nginx/conf.d/moidate.conf.disabled nginx/conf.d/moidate.conf
fi
# Remove init.conf so only moidate.conf is active
rm -f nginx/conf.d/init.conf

# ── 5. Build & start all services ─────────────────────────────────────────────
log "Building and starting all services..."
docker compose down nginx
docker compose up -d --build

# ── 6. Run database migrations ────────────────────────────────────────────────
log "Running Prisma database migrations..."
docker compose exec app npx prisma migrate deploy || warn "Migrations failed — check DATABASE_URL in .env"

log "Done! Services running:"
docker compose ps

echo ""
echo "  Main site : https://$DOMAIN"
echo "  APIs      : https://$APIS_DOMAIN/api/v1/"
echo "  Swagger   : https://$APIS_DOMAIN/api/v1/swagger"
echo ""
