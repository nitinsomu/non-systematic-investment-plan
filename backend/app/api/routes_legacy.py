from datetime import date
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.asset import AssetType
from app.models.backtest import BacktestRequest
from app.services.asset_registry import get_registered_asset_info
from app.services.backtest_service import run_backtest

router = APIRouter(tags=["legacy"])


class LegacyBacktestRequest(BaseModel):
    ticker: str
    start_date: date
    end_date: date
    monthly_amount: float = Field(gt=0)
    dip_pct: float = Field(default=5.0, gt=0)
    deploy_multiplier: float = Field(default=2.0, ge=1)


@router.get("/api/search")
def legacy_search_stock(q: str) -> dict[str, Any]:
    asset = get_registered_asset_info(AssetType.STOCK, q.strip().upper())
    return {
        "ticker": asset.ticker,
        "name": asset.name,
        "currency": asset.currency,
        "current_price": asset.latestPrice,
    }


@router.post("/api/backtest")
def legacy_backtest(request: LegacyBacktestRequest) -> dict[str, Any]:
    asset = get_registered_asset_info(AssetType.STOCK, request.ticker.strip().upper())
    modern_request = BacktestRequest.model_validate(
        {
            "enabledStrategies": ["REGULAR_SIP", "BUY_THE_DIP"],
            "assetType": "STOCK",
            "assetId": request.ticker,
            "ticker": request.ticker,
            "monthlyAmount": request.monthly_amount,
            "currency": asset.currency or "INR",
            "startDate": request.start_date.isoformat(),
            "endDate": request.end_date.isoformat(),
            "strategy": {
                "type": "BUY_THE_DIP",
                "dipThresholdPercent": request.dip_pct,
                "movingAverageDays": 200,
                "deployMultiplier": request.deploy_multiplier,
                "reserve": {"enabled": True, "baseSipPercent": 50},
                "rsi": {"period": 14, "threshold": 30},
                "momentum": {"movingAverageDays": 50},
            },
        }
    )
    result = run_backtest(modern_request)
    return {
        "ticker": result.asset.ticker,
        "sip": _legacy_strategy_payload(result, "REGULAR_SIP", "regularSipValue"),
        "dip": _legacy_strategy_payload(result, "BUY_THE_DIP", "buyTheDipValue"),
    }


def _legacy_strategy_payload(result, strategy_id: str, chart_key: str) -> dict[str, Any]:
    strategy = next(item for item in result.strategies if item.id == strategy_id)
    chart_by_date = {point.date: getattr(point, chart_key) for point in result.chart}
    invested = 0.0
    portfolio_history = []
    for event in sorted(strategy.events, key=lambda item: item.date):
        invested += event.amountInvested
        portfolio_history.append(
            {
                "date": event.date,
                "value": round(float(chart_by_date.get(event.date, 0)), 2),
                "invested": round(invested, 2),
            }
        )

    return {
        "total_invested": strategy.metrics.totalInvested,
        "final_value": strategy.metrics.currentValue,
        "xirr": strategy.metrics.xirr,
        "num_investments": strategy.metrics.numberOfInvestments,
        "portfolio_history": portfolio_history,
        "dip_triggers": sum(1 for event in strategy.events if event.amountInvested > result.metrics.regularSip.totalInvested / max(result.metrics.regularSip.numberOfInvestments, 1)),
    }
