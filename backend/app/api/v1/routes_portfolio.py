from fastapi import APIRouter

from app.models.portfolio import PortfolioRecommendationRequest, PortfolioRecommendationResponse
from app.services.portfolio_recommendation import build_portfolio_recommendations

router = APIRouter(tags=["portfolio"])


@router.post("/portfolio/recommendations", response_model=PortfolioRecommendationResponse)
def create_portfolio_recommendations(
    request: PortfolioRecommendationRequest,
) -> PortfolioRecommendationResponse:
    return build_portfolio_recommendations(request)
