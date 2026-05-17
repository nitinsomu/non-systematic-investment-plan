from app.models.asset import AssetInfo, AssetSearchResult, AssetType
from app.services.amfi_data import fetch_mutual_fund_history, get_mutual_fund_info, search_mutual_funds
from app.services.crypto_data import fetch_crypto_history, get_crypto_info, search_crypto
from app.services.market_data import fetch_price_history, get_asset_info

ETF_QUICK_PICKS = {
    "NIFTYBEES.NS": "Nippon India ETF Nifty BeES",
    "GOLDBEES.NS": "Nippon India ETF Gold BeES",
    "JUNIORBEES.NS": "Nippon India ETF Junior BeES",
}

GOLD_QUICK_PICKS = {
    "GOLDBEES.NS": "Nippon India ETF Gold BeES",
}


def search_assets(asset_type: AssetType, query: str) -> list[AssetSearchResult]:
    if asset_type == AssetType.MUTUAL_FUND:
        return search_mutual_funds(query)
    if asset_type == AssetType.CRYPTO:
        return search_crypto(query)
    if asset_type == AssetType.ETF:
        return _search_ticker_picks(AssetType.ETF, query, ETF_QUICK_PICKS)
    if asset_type == AssetType.GOLD:
        return _search_ticker_picks(AssetType.GOLD, query, GOLD_QUICK_PICKS)

    if not query.strip():
        return []

    stock = get_asset_info(query)
    return [
        AssetSearchResult(
            assetType=AssetType.STOCK,
            assetId=stock.assetId,
            ticker=stock.ticker,
            name=stock.name,
            currency=stock.currency,
            latestPrice=stock.latestPrice,
            latestPriceDate=stock.latestPriceDate,
        )
    ]


def get_registered_asset_info(asset_type: AssetType, asset_id: str) -> AssetInfo:
    if asset_type == AssetType.MUTUAL_FUND:
        return get_mutual_fund_info(asset_id)
    if asset_type == AssetType.CRYPTO:
        return get_crypto_info(asset_id)
    asset = get_asset_info(asset_id)
    if asset_type in {AssetType.ETF, AssetType.GOLD}:
        asset.assetType = asset_type
        asset.assetId = asset_id.upper()
    return asset


def fetch_registered_price_history(
    asset_type: AssetType,
    asset_id: str,
    start_date: str,
    end_date: str,
    moving_average_days: int,
    currency: str = "INR",
):
    if asset_type == AssetType.MUTUAL_FUND:
        return fetch_mutual_fund_history(asset_id, start_date, end_date, moving_average_days)
    if asset_type == AssetType.CRYPTO:
        return fetch_crypto_history(asset_id, start_date, end_date, moving_average_days, currency)
    return fetch_price_history(asset_id, start_date, end_date, moving_average_days)


def _search_ticker_picks(asset_type: AssetType, query: str, picks: dict[str, str]) -> list[AssetSearchResult]:
    normalized = query.strip().lower()
    results = []
    for ticker, name in picks.items():
        if not normalized or normalized in ticker.lower() or normalized in name.lower():
            results.append(
                AssetSearchResult(
                    assetType=asset_type,
                    assetId=ticker,
                    ticker=ticker,
                    name=name,
                    currency="INR",
                )
            )
    return results
