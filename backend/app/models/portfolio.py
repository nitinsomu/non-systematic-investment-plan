from pydantic import BaseModel, Field

from app.models.backtest import Opportunity
from app.models.watchlist import WatchlistItem


class PortfolioRecommendationRequest(BaseModel):
    monthlyBudget: float = Field(gt=0)
    maxPerAssetPercent: float = Field(default=35, gt=0, le=100)
    minimumScore: int = Field(default=55, ge=0, le=100)


class PortfolioRecommendationItem(BaseModel):
    watchlistItem: WatchlistItem
    opportunity: Opportunity
    recommendedAmount: float
    allocationPercent: float
    reason: str


class PortfolioRecommendationResponse(BaseModel):
    monthlyBudget: float
    allocatedAmount: float
    keepCashAmount: float
    recommendations: list[PortfolioRecommendationItem]
