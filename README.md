# NSIP — Non-Systematic Investment Plan

Compare investment strategies against a regular SIP using historical stock data. Currently supports the **Buy the Dip** strategy — invest extra when a stock's price drops below its 200-day moving average.

## How it works

- Search any stock by ticker (e.g. `AAPL`, `RELIANCE.NS`, `INFY.NS`)
- Configure your monthly SIP amount, date range, dip threshold, and deploy multiplier
- Run a backtest to see how Buy the Dip would have performed vs regular SIP
- Results include total invested, final value, XIRR, and a portfolio value chart

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11 |
| Data | yfinance (Yahoo Finance) |
| Calculations | pandas, numpy, pyxirr |

## Running with Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

- First build takes ~3–5 minutes
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

```bash
# Stop
docker compose down
```

## Running locally

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

## Supported tickers

- **US stocks**: `AAPL`, `MSFT`, `GOOGL`, `TSLA`, etc.
- **Indian NSE stocks**: `RELIANCE.NS`, `INFY.NS`, `TCS.NS`, `HDFCBANK.NS`, etc.
- **Indian BSE stocks**: `RELIANCE.BO`, `INFY.BO`, etc.

## Roadmap

- [ ] Mutual funds (AMFI NAV data)
- [ ] Gold, crypto, ETFs
- [ ] More strategies (RSI-based dip, value averaging, momentum)
- [ ] Alert dashboard — notify when a signal triggers on a watchlist
