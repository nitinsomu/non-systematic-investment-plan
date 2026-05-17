from datetime import timedelta

import pandas as pd
import yfinance as yf
from fastapi import status

from app.models.asset import AssetInfo, AssetType
from app.services.api_errors import api_error


def _flatten_columns(data: pd.DataFrame) -> pd.DataFrame:
    if isinstance(data.columns, pd.MultiIndex):
        data = data.copy()
        data.columns = data.columns.get_level_values(0)
    return data


def _normalize_history(data: pd.DataFrame) -> pd.DataFrame:
    data = _flatten_columns(data)
    if data.empty:
        return pd.DataFrame(columns=["date", "price"])

    data = data.reset_index()
    date_column = "Date" if "Date" in data.columns else data.columns[0]
    price_column = "Adj Close" if "Adj Close" in data.columns else "Close"

    if price_column not in data.columns:
        return pd.DataFrame(columns=["date", "price"])

    normalized = data[[date_column, price_column]].rename(
        columns={date_column: "date", price_column: "price"}
    )
    normalized["date"] = pd.to_datetime(normalized["date"]).dt.tz_localize(None)
    normalized["price"] = pd.to_numeric(normalized["price"], errors="coerce")
    normalized = normalized.dropna(subset=["date", "price"])
    normalized = normalized[normalized["price"] > 0]
    normalized = normalized.sort_values("date").reset_index(drop=True)
    return normalized


def fetch_price_history(ticker: str, start_date: str, end_date: str, moving_average_days: int) -> pd.DataFrame:
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    padded_start = start - timedelta(days=moving_average_days * 3)

    try:
        raw = yf.download(
            ticker,
            start=padded_start.date().isoformat(),
            end=(end + timedelta(days=1)).date().isoformat(),
            auto_adjust=False,
            progress=False,
            threads=False,
        )
    except Exception as exc:
        raise api_error(
            "MARKET_DATA_PROVIDER_ERROR",
            f"Could not fetch historical price data for ticker {ticker}.",
            status.HTTP_502_BAD_GATEWAY,
        ) from exc

    prices = _normalize_history(raw)
    if prices.empty:
        raise api_error("NO_PRICE_DATA", f"No historical price data found for ticker {ticker}.", status.HTTP_404_NOT_FOUND)

    prices = prices[(prices["date"] >= padded_start) & (prices["date"] <= end)].reset_index(drop=True)
    if prices.empty:
        raise api_error("NO_PRICE_DATA", f"No historical price data found for ticker {ticker}.", status.HTTP_404_NOT_FOUND)
    return prices


def get_asset_info(ticker: str) -> AssetInfo:
    normalized_ticker = ticker.strip().upper()
    if not normalized_ticker:
        raise api_error("INVALID_TICKER", "Ticker cannot be empty.")

    stock = yf.Ticker(normalized_ticker)
    name = normalized_ticker
    currency = "INR" if normalized_ticker.endswith(".NS") else "USD"
    exchange: str | None = None
    latest_price: float | None = None
    latest_price_date: str | None = None

    try:
        fast_info = stock.fast_info
        currency = str(getattr(fast_info, "currency", None) or currency)
        exchange = getattr(fast_info, "exchange", None)
        last_price = getattr(fast_info, "last_price", None)
        latest_price = float(last_price) if last_price is not None else None
    except Exception:
        pass

    try:
        info = stock.info
        name = info.get("longName") or info.get("shortName") or name
        currency = info.get("currency") or currency
        exchange = info.get("exchange") or exchange
    except Exception:
        pass

    try:
        recent = fetch_price_history(normalized_ticker, (pd.Timestamp.today() - timedelta(days=10)).date().isoformat(), pd.Timestamp.today().date().isoformat(), 20)
        last_row = recent.iloc[-1]
        latest_price = float(last_row["price"])
        latest_price_date = pd.Timestamp(last_row["date"]).date().isoformat()
    except Exception:
        pass

    return AssetInfo(
        assetType=AssetType.STOCK,
        assetId=normalized_ticker,
        ticker=normalized_ticker,
        name=name,
        currency=currency,
        exchange=exchange,
        latestPrice=latest_price,
        latestPriceDate=latest_price_date,
    )
