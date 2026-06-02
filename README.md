# Golden Financier

Personal finance tracker. Single-user, self-hosted, mobile-first.

## Stack

- **Backend:** Go (Chi + sqlx + modernc.org/sqlite)
- **Frontend:** React + Vite + Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts
- **Database:** SQLite (zero ops, file-based)
- **Style:** Neo Brutalism (thick borders, hard shadows, Space Grotesk)

## Quick Start

```bash
# Backend
cd backend
./run.sh              # starts on :8080

# Frontend (separate terminal)
cd frontend
cp .env.example .env  # set VITE_AUTH_TOKEN to match backend
./run.sh              # starts on :5173
```

Open `http://localhost:5173`.

## Deploy

```bash
./deploy.sh
```

Requires a [Fly.io](https://fly.io) account (free tier). The script installs `flyctl`, creates the app, sets up a 1GB persistent volume for SQLite, and deploys to Singapore.

**Note:** Fly.io requires a credit card on file even for the free tier (no charges for free usage). Add yours at https://fly.io/dashboard/billing before running the script.

## Features

- Dashboard with net worth, income/expense summary, recent transactions
- Transaction management (create, edit, delete) with account + category
- Account management (checking, savings, credit card, cash, etc.)
- Category tree (parent/child) with icon + color picker
- Monthly reports with spending breakdown (donut chart)
- Multi-month and per-account filtering
- CSV import (Phase 2)
- Budgets (Phase 2)

## Project Structure

```
golden-financier/
├── backend/            # Go API server
│   ├── handler/        # HTTP handlers
│   ├── model/          # Structs + SQL queries
│   ├── migrate/        # Schema migrations
│   └── embed.go        # Embeds built frontend
├── frontend/           # React SPA
│   └── src/
│       ├── pages/      # Page components
│       ├── api/        # API client + types
│       ├── hooks/      # React Query hooks
│       ├── i18n/       # Translations (EN/ID)
│       └── lib/        # Formatting utilities
├── Dockerfile          # Multi-stage build
├── fly.toml            # Fly.io config
├── deploy.sh           # One-command deploy
├── PLAN.md             # Architecture & roadmap
└── README.md
```

## API

All endpoints at `/api/v1/`. Auth via `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| GET | /health | Health check (no auth) |
| GET | /api/v1/accounts | List accounts |
| POST | /api/v1/accounts | Create account |
| PUT | /api/v1/accounts/:id | Update account |
| DELETE | /api/v1/accounts/:id | Archive account |
| GET | /api/v1/categories | List categories |
| POST | /api/v1/categories | Create category |
| PUT | /api/v1/categories/:id | Update category |
| DELETE | /api/v1/categories/:id | Delete category |
| GET | /api/v1/transactions | List transactions |
| POST | /api/v1/transactions | Create transaction |
| PUT | /api/v1/transactions/:id | Update transaction |
| DELETE | /api/v1/transactions/:id | Delete transaction |
| GET | /api/v1/reports/monthly?month=YYYY-MM | Monthly report |
| GET | /api/v1/reports/net-worth | Net worth history |

## Design System

Neo Brutalism — see `PLAN.md` for the full architecture and `i18n/` for language support (English / Indonesian toggle in nav).
