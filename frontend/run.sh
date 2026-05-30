#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "→ Created .env from .env.example — edit VITE_AUTH_TOKEN to match backend"
  fi
fi

echo "→ Installing dependencies if needed"
npm install --silent

echo "→ Starting frontend on :5173"
npm run dev
