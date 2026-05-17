from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.asset import AssetType
from app.models.backtest import BacktestStrategyId, Opportunity, StrategyConfig


class AlertLevel(str):
    pass


class Alert(BaseModel):
    alertStatus: str
    alertLevel: str
    isActionable: bool
    alertReason: str


class WatchlistItemCreate(BaseModel):
    assetType: AssetType
    assetId: str
    ticker: str
    name: str
    currency: str
    monthlyAmount: float = Field(gt=0)
    enabledStrategies: list[BacktestStrategyId]
    strategy: StrategyConfig


class WatchlistItem(WatchlistItemCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WatchlistEvaluationItem(BaseModel):
    watchlistItem: WatchlistItem
    opportunity: Opportunity
    alert: Alert
    lastEvaluatedAt: str


class AlertSummary(BaseModel):
    total: int
    buy: int
    avoid: int
    watch: int
    none: int


class WatchlistEvaluationResponse(BaseModel):
    items: list[WatchlistEvaluationItem]
    summary: AlertSummary
