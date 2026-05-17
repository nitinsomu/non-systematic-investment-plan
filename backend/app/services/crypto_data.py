from datetime import datetime, timezone

import pandas as pd
import requests
from fastapi import status

from app.models.asset import AssetInfo, AssetSearchResult, AssetType
from app.services.api_errors import api_error
from app.services.market_data import fetch_price_history

COINGECKO_MARKET_CHART_URL = "https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart/range"

SUPPORTED_CRYPTO = {
    "bitcoin": {"ticker": "BTC", "name": "Bitcoin"},
    "ethereum": {"ticker": "ETH", "name": "Ethereum"},
    "solana": {"ticker": "SOL", "name": "Solana"},
}

YAHOO_CRYPTO_TICKERS = {
    "bitcoin": {"INR": "BTC-INR", "USD": "BTC-USD"},
    "ethereum": {"INR": "ETH-INR", "USD": "ETH-USD"},
    "solana": {"INR": "SOL-INR", "USD": "SOL-USD"},
}


def search_crypto(query: str) -> list[AssetSearchResult]:
    normalized = query.strip().lower()
    if not normalized:
        return [
            _crypto_search_result(coin_id)
            for coin_id in SUPPORTED_CRYPTO
        ]

    results = []
    for coin_id, meta in SUPPORTED_CRYPTO.items():
        if normalized in coin_id or normalized in meta["ticker"].lower() or normalized in meta["name"].lower():
            results.append(_crypto_search_result(coin_id))
    return results


def get_crypto_info(coin_id: str, currency: str = "INR") -> AssetInfo:
    normalized = coin_id.strip().lower()
    if normalized not in SUPPORTED_CRYPTO:
        raise api_error("INVALID_TICKER", f"Unsupported crypto asset {coin_id}.")

    meta = SUPPORTED_CRYPTO[normalized]
    latest_price = None
    latest_date = None
    try:
        recent = fetch_crypto_history(
            normalized,
            (pd.Timestamp.utcnow() - pd.Timedelta(days=10)).date().isoformat(),
            pd.Timestamp.utcnow().date().isoformat(),
            20,
            currency,
        )
        last_row = recent.iloc[-1]
        latest_price = float(last_row["price"])
        latest_date = pd.Timestamp(last_row["date"]).date().isoformat()
    except Exception:
        pass

    return AssetInfo(
        assetType=AssetType.CRYPTO,
        assetId=normalized,
        ticker=meta["ticker"],
        name=meta["name"],
        currency=currency.upper(),
        exchange="CoinGecko",
        latestPrice=latest_price,
        latestPriceDate=latest_date,
    )


def fetch_crypto_history(
    coin_id: str,
    start_date: str,
    end_date: str,
    moving_average_days: int,
    currency: str = "INR",
) -> pd.DataFrame:
    normalized = coin_id.strip().lower()
    if normalized not in SUPPORTED_CRYPTO:
        raise api_error("INVALID_TICKER", f"Unsupported crypto asset {coin_id}.")

    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    padded_start = start - pd.Timedelta(days=moving_average_days * 3)
    params = {
        "vs_currency": currency.lower(),
        "from": int(padded_start.replace(tzinfo=timezone.utc).timestamp()),
        "to": int((end + pd.Timedelta(days=1)).replace(tzinfo=timezone.utc).timestamp()),
    }

    try:
        response = requests.get(COINGECKO_MARKET_CHART_URL.format(coin_id=normalized), params=params, timeout=20)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException:
        return _fetch_crypto_history_fallback(normalized, start_date, end_date, moving_average_days, currency)

    rows = []
    for timestamp_ms, price in payload.get("prices", []):
        rows.append(
            {
                "date": datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).replace(tzinfo=None),
                "price": float(price),
            }
        )

    prices = pd.DataFrame(rows)
    if prices.empty:
        raise api_error("NO_PRICE_DATA", f"No crypto price history found for {coin_id}.", status.HTTP_404_NOT_FOUND)

    prices["date"] = pd.to_datetime(prices["date"]).dt.normalize()
    prices = prices.groupby("date", as_index=False).last()
    prices = prices[(prices["date"] >= padded_start) & (prices["date"] <= end)].reset_index(drop=True)
    if prices.empty:
        raise api_error("NO_PRICE_DATA", f"No crypto price history found for {coin_id}.", status.HTTP_404_NOT_FOUND)
    return prices


def _crypto_search_result(coin_id: str) -> AssetSearchResult:
    meta = SUPPORTED_CRYPTO[coin_id]
    return AssetSearchResult(
        assetType=AssetType.CRYPTO,
        assetId=coin_id,
        ticker=meta["ticker"],
        name=meta["name"],
        currency="INR",
    )


def _fetch_crypto_history_fallback(
    coin_id: str,
    start_date: str,
    end_date: str,
    moving_average_days: int,
    currency: str,
) -> pd.DataFrame:
    ticker = YAHOO_CRYPTO_TICKERS.get(coin_id, {}).get(currency.upper()) or YAHOO_CRYPTO_TICKERS[coin_id]["USD"]
    return fetch_price_history(ticker, start_date, end_date, moving_average_days)
