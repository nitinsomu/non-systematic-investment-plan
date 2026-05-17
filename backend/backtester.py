import pandas as pd
import yfinance as yf
from datetime import date, timedelta
from typing import Optional
from pyxirr import xirr as compute_xirr


def get_stock_data(ticker: str, start: date, end: date) -> pd.DataFrame:
    buffer_start = start - timedelta(days=300)
    t = yf.Ticker(ticker)
    df = t.history(start=buffer_start, end=end, auto_adjust=True)
    if df.empty:
        return df
    df.index = df.index.tz_localize(None)
    return df[["Close"]].copy()


def nearest_trading_day(df: pd.DataFrame, target: date) -> Optional[pd.Timestamp]:
    ts = pd.Timestamp(target)
    available = df.index[df.index >= ts]
    return available[0] if len(available) else None


def month_starts(start: date, end: date) -> list[date]:
    months = []
    current = date(start.year, start.month, 1)
    while current <= end:
        months.append(current)
        next_month = current.month % 12 + 1
        next_year = current.year + (1 if current.month == 12 else 0)
        current = date(next_year, next_month, 1)
    return months


def build_history(df, inv_dates, units_list, amounts):
    history = []
    cumulative_units = 0.0
    cumulative_invested = 0.0
    for d, units, amount in zip(inv_dates, units_list, amounts):
        cumulative_units += units
        cumulative_invested += amount
        price = float(df.loc[pd.Timestamp(d), "Close"])
        history.append({
            "date": str(d),
            "value": round(cumulative_units * price, 2),
            "invested": round(cumulative_invested, 2),
        })
    return history


def run_sip(df: pd.DataFrame, start: date, end: date, monthly_amount: float) -> dict:
    df = df.copy()
    df["SMA200"] = df["Close"].rolling(200).mean()

    inv_dates, amounts, units_list = [], [], []
    total_units = 0.0

    for ms in month_starts(start, end):
        td = nearest_trading_day(df, ms)
        if td is None:
            continue
        price = float(df.loc[td, "Close"])
        units = monthly_amount / price
        total_units += units
        inv_dates.append(td.date())
        amounts.append(monthly_amount)
        units_list.append(units)

    last_price = float(df["Close"].iloc[-1])
    final_value = total_units * last_price
    total_invested = sum(amounts)

    try:
        cash_flows = dict(zip(inv_dates + [end], [-a for a in amounts] + [final_value]))
        xirr_val = compute_xirr(cash_flows) * 100
    except Exception:
        xirr_val = None

    return {
        "total_invested": round(total_invested, 2),
        "final_value": round(final_value, 2),
        "xirr": round(xirr_val, 2) if xirr_val is not None else None,
        "num_investments": len(inv_dates),
        "portfolio_history": build_history(df, inv_dates, units_list, amounts),
    }


def run_buy_the_dip(
    df: pd.DataFrame,
    start: date,
    end: date,
    monthly_amount: float,
    dip_pct: float,
    deploy_multiplier: float,
) -> dict:
    df = df.copy()
    df["SMA200"] = df["Close"].rolling(200).mean()

    inv_dates, amounts, units_list = [], [], []
    total_units = 0.0
    dip_count = 0

    for ms in month_starts(start, end):
        td = nearest_trading_day(df, ms)
        if td is None:
            continue
        price = float(df.loc[td, "Close"])
        sma = df.loc[td, "SMA200"]

        if pd.notna(sma) and price < float(sma) * (1 - dip_pct / 100):
            invest = monthly_amount * deploy_multiplier
            dip_count += 1
        else:
            invest = monthly_amount

        units = invest / price
        total_units += units
        inv_dates.append(td.date())
        amounts.append(invest)
        units_list.append(units)

    last_price = float(df["Close"].iloc[-1])
    final_value = total_units * last_price
    total_invested = sum(amounts)

    try:
        cash_flows = dict(zip(inv_dates + [end], [-a for a in amounts] + [final_value]))
        xirr_val = compute_xirr(cash_flows) * 100
    except Exception:
        xirr_val = None

    return {
        "total_invested": round(total_invested, 2),
        "final_value": round(final_value, 2),
        "xirr": round(xirr_val, 2) if xirr_val is not None else None,
        "num_investments": len(inv_dates),
        "dip_triggers": dip_count,
        "portfolio_history": build_history(df, inv_dates, units_list, amounts),
    }
