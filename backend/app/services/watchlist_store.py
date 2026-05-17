import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.backtest import BacktestRequest
from app.models.watchlist import WatchlistEvaluationItem, WatchlistEvaluationResponse, WatchlistItem, WatchlistItemCreate
from app.services.alert_service import build_alert, summarize_alerts
from app.services.asset_registry import fetch_registered_price_history
from app.services.indicators import add_momentum_average, add_moving_average, add_rsi
from app.services.opportunity import evaluate_opportunity

WATCHLIST_PATH = Path(__file__).resolve().parents[2] / "data" / "watchlist.json"


def list_watchlist_items() -> list[WatchlistItem]:
    return [WatchlistItem(**item) for item in _read_items()]


def create_watchlist_item(payload: WatchlistItemCreate) -> WatchlistItem:
    item = WatchlistItem(**payload.model_dump())
    items = _read_items()
    items.append(item.model_dump(mode="json"))
    _write_items(items)
    return item


def delete_watchlist_item(item_id: str) -> dict[str, bool]:
    items = _read_items()
    remaining = [item for item in items if item.get("id") != item_id]
    _write_items(remaining)
    return {"deleted": len(remaining) != len(items)}


def evaluate_watchlist_items() -> WatchlistEvaluationResponse:
    evaluated: list[WatchlistEvaluationItem] = []
    now = datetime.now(timezone.utc).isoformat()
    for item in list_watchlist_items():
        request = _request_from_watchlist_item(item)
        prices = fetch_registered_price_history(
            request.asset_type,
            request.resolved_asset_id,
            request.start_date,
            request.end_date,
            request.strategy.moving_average_days,
            request.currency,
        )
        prices = add_moving_average(prices, request.strategy.moving_average_days)
        prices = add_rsi(prices, request.strategy.rsi.period)
        prices = add_momentum_average(prices, request.strategy.momentum.moving_average_days)
        opportunity = evaluate_opportunity(prices, request)
        alert = build_alert(opportunity)
        evaluated.append(
            WatchlistEvaluationItem(watchlistItem=item, opportunity=opportunity, alert=alert, lastEvaluatedAt=now)
        )
    return WatchlistEvaluationResponse(items=evaluated, summary=summarize_alerts(evaluated))


def _request_from_watchlist_item(item: WatchlistItem) -> BacktestRequest:
    return BacktestRequest(
        enabledStrategies=item.enabledStrategies,
        assetType=item.assetType,
        assetId=item.assetId,
        ticker=item.ticker,
        monthlyAmount=item.monthlyAmount,
        currency=item.currency,
        startDate="2020-01-01",
        endDate=datetime.now(timezone.utc).date().isoformat(),
        strategy=item.strategy,
    )


def _read_items() -> list[dict]:
    if not WATCHLIST_PATH.exists():
        return []
    with WATCHLIST_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return data if isinstance(data, list) else []


def _write_items(items: list[dict]) -> None:
    WATCHLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with WATCHLIST_PATH.open("w", encoding="utf-8") as file:
        json.dump(items, file, indent=2)
