#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Load .env if present
if [ -f .env ]; then
  set -a; source .env; set +a
fi

export AUTH_TOKEN="${AUTH_TOKEN:-dev-token}"
export DATABASE_PATH="${DATABASE_PATH:-./finance.db}"

echo "→ Starting backend on :8080"
go run .
