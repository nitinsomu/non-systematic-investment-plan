from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
import yfinance as yf

from backtester import get_stock_data, run_sip, run_buy_the_dip

app = FastAPI(title="NSIP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/search")
def search_stock(q: str):
    ticker = q.strip().upper()
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="5d")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock not found or delisted")

        last_price = float(hist["Close"].iloc[-1])
        info = t.info
        name = info.get("shortName") or info.get("longName") or ticker
        currency = info.get("currency", "")

        return {"ticker": ticker, "name": name, "currency": currency, "current_price": last_price}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BacktestRequest(BaseModel):
    ticker: str
    start_date: date
    end_date: date
    monthly_amount: float
    dip_pct: float = 5.0
    deploy_multiplier: float = 2.0


@app.post("/api/backtest")
def backtest(req: BacktestRequest):
    try:
        df = get_stock_data(req.ticker.upper(), req.start_date, req.end_date)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No price data found for {req.ticker}")

        sip = run_sip(df, req.start_date, req.end_date, req.monthly_amount)
        dip = run_buy_the_dip(
            df, req.start_date, req.end_date,
            req.monthly_amount, req.dip_pct, req.deploy_multiplier,
        )
        return {"ticker": req.ticker.upper(), "sip": sip, "dip": dip}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
