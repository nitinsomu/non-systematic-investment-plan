from functools import lru_cache

import pandas as pd
import requests
from fastapi import status

from app.models.asset import AssetInfo, AssetSearchResult, AssetType
from app.services.api_errors import api_error

AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt"
MFAPI_SCHEME_URL = "https://api.mfapi.in/mf/{scheme_code}"


def _parse_amfi_nav_text(text: str) -> list[dict]:
    schemes: list[dict] = []
    for line in text.splitlines():
        parts = [part.strip() for part in line.split(";")]
        if len(parts) != 6 or not parts[0].isdigit():
            continue

        nav = _to_float(parts[4])
        if nav is None:
            continue

        schemes.append(
            {
                "scheme_code": parts[0],
                "scheme_name": parts[3],
                "nav": nav,
                "date": pd.to_datetime(parts[5], format="%d-%b-%Y", errors="coerce"),
            }
        )
    return schemes


@lru_cache(maxsize=1)
def _load_amfi_schemes() -> tuple[dict, ...]:
    try:
        response = requests.get(AMFI_NAV_URL, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise api_error(
            "MARKET_DATA_PROVIDER_ERROR",
            "Could not fetch AMFI mutual fund scheme data.",
            status.HTTP_502_BAD_GATEWAY,
        ) from exc

    return tuple(_parse_amfi_nav_text(response.text))


def search_mutual_funds(query: str, limit: int = 12) -> list[AssetSearchResult]:
    normalized_query = query.strip().lower()
    if len(normalized_query) < 2:
        return []

    matches: list[AssetSearchResult] = []
    for scheme in _load_amfi_schemes():
        if normalized_query not in scheme["scheme_name"].lower() and normalized_query not in scheme["scheme_code"]:
            continue

        latest_date = scheme["date"]
        matches.append(
            AssetSearchResult(
                assetType=AssetType.MUTUAL_FUND,
                assetId=scheme["scheme_code"],
                ticker=scheme["scheme_code"],
                name=scheme["scheme_name"],
                currency="INR",
                latestPrice=scheme["nav"],
                latestPriceDate=latest_date.date().isoformat() if not pd.isna(latest_date) else None,
            )
        )
        if len(matches) >= limit:
            break
    return matches


def get_mutual_fund_info(scheme_code: str) -> AssetInfo:
    normalized_code = scheme_code.strip()
    if not normalized_code.isdigit():
        raise api_error("INVALID_TICKER", "Mutual fund scheme code must be numeric.")

    for scheme in _load_amfi_schemes():
        if scheme["scheme_code"] == normalized_code:
            latest_date = scheme["date"]
            return AssetInfo(
                assetType=AssetType.MUTUAL_FUND,
                assetId=normalized_code,
                ticker=normalized_code,
                name=scheme["scheme_name"],
                currency="INR",
                exchange="AMFI",
                latestPrice=scheme["nav"],
                latestPriceDate=latest_date.date().isoformat() if not pd.isna(latest_date) else None,
            )

    raise api_error("NO_PRICE_DATA", f"No mutual fund found for scheme code {normalized_code}.", status.HTTP_404_NOT_FOUND)


def fetch_mutual_fund_history(scheme_code: str, start_date: str, end_date: str, moving_average_days: int) -> pd.DataFrame:
    normalized_code = scheme_code.strip()
    if not normalized_code.isdigit():
        raise api_error("INVALID_TICKER", "Mutual fund scheme code must be numeric.")

    try:
        response = requests.get(MFAPI_SCHEME_URL.format(scheme_code=normalized_code), timeout=20)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise api_error(
            "MARKET_DATA_PROVIDER_ERROR",
            f"Could not fetch NAV history for scheme code {normalized_code}.",
            status.HTTP_502_BAD_GATEWAY,
        ) from exc

    rows = []
    for item in payload.get("data", []):
        nav = _to_float(item.get("nav"))
        date = pd.to_datetime(item.get("date"), format="%d-%m-%Y", errors="coerce")
        if nav is None or pd.isna(date):
            continue
        rows.append({"date": date, "price": nav})

    prices = pd.DataFrame(rows)
    if prices.empty:
        raise api_error("NO_PRICE_DATA", f"No NAV history found for scheme code {normalized_code}.", status.HTTP_404_NOT_FOUND)

    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    padded_start = start - pd.Timedelta(days=moving_average_days * 3)
    prices = prices.sort_values("date").reset_index(drop=True)
    prices = prices[(prices["date"] >= padded_start) & (prices["date"] <= end)].reset_index(drop=True)
    if prices.empty:
        raise api_error(
            "NO_PRICE_DATA",
            f"No NAV history found for scheme code {normalized_code} in the selected date range.",
            status.HTTP_404_NOT_FOUND,
        )
    return prices


def _to_float(value: object) -> float | None:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None
