# NSIP — Claude Code context

## What this project is

A web app for backtesting "Buy the Dip" investing strategies against regular SIP. Users pick an asset and a date range, configure strategy parameters, and see a side-by-side comparison of returns, XIRR, and portfolio growth over time.

## Stack

- **Backend**: FastAPI, Python 3.14, yfinance 1.3.0, pyxirr, pandas, peewee (SQLite for watchlist)
- **Frontend**: Next.js 16, React 19, Tailwind v4, react-hook-form + zod, Recharts
- **Infrastructure**: Docker Compose

## Running the project

Docker (preferred):
```bash
docker compose up --build
```

Local:
```bash
# Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## Backend layout

```
backend/app/
  main.py                  # FastAPI app, CORS, routers
  core/config.py           # Settings (NSIP_ALLOWED_ORIGINS env var)
  api/
    routes_legacy.py       # /api/search, /api/backtest — keeps old frontend calls working
    v1/
      routes_assets.py     # GET /api/v1/assets/{type}/{id}
      routes_backtests.py  # POST /api/v1/backtests
      routes_watchlist.py  # CRUD /api/v1/watchlist
      routes_portfolio.py  # POST /api/v1/portfolio/recommendations
  services/
    sip.py                 # Regular SIP simulation
    buy_the_dip.py         # Buy the Dip simulation
    reserve_buy_the_dip.py # Reserve-aware Buy the Dip
    rsi_dip.py             # RSI Dip simulation
    momentum_boost.py      # Momentum Boost simulation
    backtest_service.py    # Orchestrates all strategies for a single request
    indicators.py          # Moving average + RSI calculation
    market_data.py         # yfinance wrapper (fetches 300-day buffer before start date)
    amfi_data.py           # Indian mutual fund NAV from AMFI
    crypto_data.py         # Crypto prices
    metrics.py             # XIRR (pyxirr), return %, gain/loss
    opportunity.py         # Scores current buy signal (0–100) using dip/RSI/momentum
    watchlist_store.py     # Peewee SQLite CRUD
```

Entry point: `uvicorn app.main:app`

## Frontend layout

```
frontend/
  app/
    page.tsx               # Renders <BacktestDashboard />
    globals.css            # Dark theme, .nsip-card/.nsip-input/.nsip-button classes
  components/
    backtest-dashboard.tsx # Top-level state, form submit, API calls
    asset-search.tsx       # Ticker lookup + asset type selector
    strategy-form.tsx      # All configuration inputs with section-level info tooltips
    backtest-verdict.tsx   # Winner banner
    results-summary.tsx    # Per-strategy metrics table
    portfolio-chart.tsx    # Recharts line chart of portfolio value over time
    strategy-ranking.tsx   # Ranked by XIRR (not absolute value)
    opportunity-panel.tsx  # Current signal score + add-to-watchlist
  lib/
    api.ts                 # All fetch calls to the backend
    schemas.ts             # Zod validation schema for the form
    types.ts               # Shared TypeScript types
    format.ts              # formatMoney, formatPercent helpers
```

## Key design decisions

- **XIRR over CAGR**: strategies invest irregular amounts at irregular times, so XIRR is the correct measure of return. Strategy ranking sorts by XIRR.
- **300-day buffer**: market_data fetches price data 300 days before `startDate` so the 200-day moving average is fully warmed up before the first investment.
- **Reserve-aware strategy**: assumes no war chest — saves a fixed % of each SIP as reserve before deploying on dips. More realistic than vanilla Buy the Dip.
- **Tailwind v4**: uses `@import "tailwindcss"` syntax, not the v3 `@tailwind base/components/utilities` directives.
- **color-scheme: dark** on `.nsip-input`: makes the browser-native date picker calendar match the dark theme.
- **Docker .dockerignore**: `node_modules` and `.next` are excluded from the Docker build context — critical to prevent local installs from overwriting Docker-installed packages (caused Next.js version mismatch).

## Asset types supported

| Type | Example ticker |
|---|---|
| Stock | `RELIANCE.NS` |
| ETF | `NIFTYBEES.NS` |
| Gold | `GOLDBEES.NS` |
| Crypto | `bitcoin` |
| Mutual Fund | searched by name via AMFI |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NSIP_ALLOWED_ORIGINS` | `["http://localhost:3000"]` | CORS allowed origins (JSON array string) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend URL used by the frontend |
