# NSIP — Non-Systematic Investment Plan

Backtest "Buy the Dip" strategies against regular SIP for Indian stocks, ETFs, gold, and crypto. Compare results side-by-side with XIRR, returns, and a portfolio value chart.

## Strategies

| Strategy | What it does |
|---|---|
| **Regular SIP** | Invests the same fixed amount every month — the baseline. |
| **Buy the Dip** | Invests more (e.g. 2×) when the price falls below its 200-day moving average by a set threshold. |
| **Reserve-Aware Buy the Dip** | Same as above, but saves a portion of the SIP each month as a reserve first — no assumption of unlimited extra cash. |
| **RSI Dip** | Invests more when RSI drops below a threshold (default: 30), indicating the asset may be oversold. |
| **Momentum Boost** | Invests more when price is *above* the moving average — tests whether riding winners beats buying dips. |

All strategies run on the same date range and monthly amount so results are directly comparable.

## Running with Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Running locally

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000. It expects the backend at `http://localhost:8000` by default. Override with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://your-backend-url npm run dev
```

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_legacy.py      # /api/search, /api/backtest (backwards compat)
│   │   │   └── v1/
│   │   │       ├── routes_assets.py
│   │   │       ├── routes_backtests.py
│   │   │       ├── routes_watchlist.py
│   │   │       └── routes_portfolio.py
│   │   ├── services/
│   │   │   ├── sip.py
│   │   │   ├── buy_the_dip.py
│   │   │   ├── reserve_buy_the_dip.py
│   │   │   ├── rsi_dip.py
│   │   │   ├── momentum_boost.py
│   │   │   ├── indicators.py         # Moving average, RSI calculation
│   │   │   ├── market_data.py        # yfinance wrapper
│   │   │   ├── amfi_data.py          # Mutual fund NAV data
│   │   │   ├── crypto_data.py        # Crypto price data
│   │   │   ├── metrics.py            # XIRR, return calculations
│   │   │   └── opportunity.py        # Current buy signal scoring
│   │   ├── models/
│   │   └── core/config.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   │   ├── backtest-dashboard.tsx    # Main page shell
│   │   ├── asset-search.tsx
│   │   ├── strategy-form.tsx         # Configuration inputs
│   │   ├── backtest-verdict.tsx
│   │   ├── results-summary.tsx
│   │   ├── portfolio-chart.tsx
│   │   ├── strategy-ranking.tsx      # Sorted by XIRR
│   │   └── opportunity-panel.tsx     # Current signal + watchlist
│   ├── lib/
│   │   ├── api.ts
│   │   ├── schemas.ts                # Zod form validation
│   │   ├── types.ts
│   │   └── format.ts
│   └── Dockerfile
└── docker-compose.yml
```

## Notes

- Indian stocks use the `.NS` suffix (e.g. `RELIANCE.NS`, `NIFTYBEES.NS`).
- The backend fetches 300 extra days of price history before the start date to warm up moving average indicators.
- XIRR is used instead of CAGR because strategies invest irregular amounts at irregular times.
- Strategy ranking is sorted by XIRR, not absolute portfolio value, to avoid favouring strategies that simply deployed more capital.
