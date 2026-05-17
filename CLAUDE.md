# CLAUDE.md

## Project overview

Non-Systematic Investment Plan (NSIP) — a web app that backtests alternative investment strategies against a regular SIP using historical stock data.

## Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Recharts, react-day-picker
- **Backend**: FastAPI + Python 3.11
- **Data**: yfinance (Yahoo Finance) — no API key required
- **Calculations**: pandas, numpy, pyxirr (XIRR for irregular cash flows)

## Project structure

```
backend/
  main.py          — FastAPI app, /api/search and /api/backtest endpoints
  backtester.py    — SIP and Buy the Dip logic, XIRR calculation
  session.py       — (unused, kept for reference) custom requests session
  requirements.txt
  Dockerfile

frontend/
  src/
    app/           — Next.js App Router (layout, page, globals.css)
    components/    — StockSearch, StrategyForm, DatePicker, ResultsView
    lib/api.ts     — typed API client
  package.json
  Dockerfile

docker-compose.yml
```

## Running

```bash
docker compose up --build   # recommended
```

Or locally: backend on port 8000 (uvicorn), frontend on port 3000 (next dev).

## Current strategy: Buy the Dip

- Invest the regular SIP amount every month (1st of each month, nearest trading day)
- When price is X% below the 200-day SMA → invest N× the regular amount instead
- Default: 5% dip threshold, 2× multiplier
- XIRR is used (not CAGR) because cash flows are irregular

## Key design decisions

- The 200-day SMA requires 300 days of buffer data fetched before the backtest start date
- Buy the Dip assumes capital is always available on dip months (war chest assumption) — this is surfaced as a disclaimer in the UI
- XIRR and absolute gain can point in different directions — the verdict banner handles all four cases honestly
- yfinance 1.3.0+ required; earlier versions fail with Yahoo Finance's auth flow

## Notes for Claude

- Prioritize simplicity — don't over-engineer before the core logic is proven
- Stocks only for now; mutual funds, gold, crypto come later (tracked in GitHub issues)
- Next strategies to add: RSI-based dip, value averaging (tracked in issue #5)
- Alert dashboard is a separate future feature (tracked in issue #6)
