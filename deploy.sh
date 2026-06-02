#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ─── Config ──────────────────────────────────────────────
APP_NAME="${FLY_APP_NAME:-golden-financier}"
REGION="${FLY_REGION:-sin}"            # Singapore — closest to Indonesia
AUTH_TOKEN="${AUTH_TOKEN:-}"

# ─── Colors ──────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${BOLD}${GREEN}→${NC} $1"; }
warn()  { echo -e "${BOLD}${YELLOW}⚠${NC} $1"; }
error() { echo -e "${BOLD}${RED}✖${NC} $1"; exit 1; }

# ─── Prerequisites ──────────────────────────────────────

# 1. Install flyctl if missing
if ! command -v flyctl &>/dev/null && ! command -v fly &>/dev/null; then
  info "Installing flyctl..."
  curl -fsSL https://fly.io/install.sh | sh
  export FLYCTL_INSTALL="$HOME/.fly"
  export PATH="$FLYCTL_INSTALL/bin:$PATH"
  echo 'export PATH="$HOME/.fly/bin:$PATH"' >> "$HOME/.bashrc"
fi
FLY="$(command -v flyctl || command -v fly)"
info "Using $($FLY version 2>&1 | head -1)"

# 2. Ensure logged in
if ! $FLY auth whoami &>/dev/null; then
  info "Logging in to Fly.io..."
  $FLY auth login
fi

# 3. Check billing (required by Fly.io even for free tier)
BILLING_OK=$($FLY billing dashboard 2>&1 || true)
if echo "$BILLING_OK" | grep -qi "payment\|credit card\|billing"; then
  warn "Fly.io requires billing info (no charge for free tier usage)."
  warn "Open https://fly.io/dashboard/billing to add a card, then re-run."
  echo ""
  read -rp "Press Enter after adding billing info, or Ctrl+C to abort..."
fi

# 4. Validate frontend builds
info "Validating frontend build..."
(cd frontend && npm install --silent && npm run build) || error "Frontend build failed"

# 4. Set AUTH_TOKEN (with fallback)
if [ -z "$AUTH_TOKEN" ]; then
  if [ -f frontend/.env ]; then
    AUTH_TOKEN="$(grep -oP 'VITE_AUTH_TOKEN=\K.*' frontend/.env || true)"
  fi
  if [ -z "$AUTH_TOKEN" ]; then
    AUTH_TOKEN="$(openssl rand -hex 32)"
    warn "No AUTH_TOKEN found. Generated: ${AUTH_TOKEN}"
    warn "Set VITE_AUTH_TOKEN=${AUTH_TOKEN} in frontend/.env for local dev"
  fi
fi

# ─── Fly.io setup ────────────────────────────────────────

# 5. Create app if it doesn't exist
if ! $FLY apps list 2>/dev/null | grep -q "$APP_NAME"; then
  info "Creating Fly app: $APP_NAME"
  $FLY apps create "$APP_NAME"
else
  info "App $APP_NAME already exists"
fi

# 6. Set secrets
info "Setting AUTH_TOKEN secret..."
$FLY secrets set AUTH_TOKEN="$AUTH_TOKEN" --app "$APP_NAME"

# 7. Create volume if it doesn't exist
if ! $FLY volumes list --app "$APP_NAME" 2>/dev/null | grep -q "data"; then
  info "Creating 1GB persistent volume..."
  $FLY volumes create data --app "$APP_NAME" --region "$REGION" --size 1 --yes
else
  info "Volume 'data' already exists"
fi

# 8. Deploy
info "Deploying to Fly.io..."
$FLY deploy --app "$APP_NAME" --strategy immediate

echo ""
echo -e "${BOLD}${GREEN}✔${NC} Deployed!"
echo "   App:    https://$APP_NAME.fly.dev"
echo "   Token:  $AUTH_TOKEN"
echo ""
echo "  For local dev, set in frontend/.env:"
echo "  VITE_AUTH_TOKEN=${AUTH_TOKEN}"
