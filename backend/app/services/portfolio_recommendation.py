from app.models.portfolio import (
    PortfolioRecommendationItem,
    PortfolioRecommendationRequest,
    PortfolioRecommendationResponse,
)
from app.services.watchlist_store import evaluate_watchlist_items


def build_portfolio_recommendations(request: PortfolioRecommendationRequest) -> PortfolioRecommendationResponse:
    evaluations = evaluate_watchlist_items().items
    candidates = [
        item
        for item in evaluations
        if item.opportunity.score >= request.minimumScore
        and item.opportunity.suggestedAction != "AVOID_CHASING"
        and item.alert.alertLevel in {"BUY", "WATCH"}
    ]

    total_score = sum(item.opportunity.score for item in candidates)
    cap = request.monthlyBudget * (request.maxPerAssetPercent / 100)
    remaining = request.monthlyBudget
    recommendations: list[PortfolioRecommendationItem] = []

    for item in sorted(candidates, key=lambda candidate: candidate.opportunity.score, reverse=True):
        if remaining <= 0 or total_score <= 0:
            break
        raw_amount = request.monthlyBudget * (item.opportunity.score / total_score)
        amount = min(raw_amount, cap, remaining)
        if amount <= 0:
            continue
        remaining -= amount
        recommendations.append(
            PortfolioRecommendationItem(
                watchlistItem=item.watchlistItem,
                opportunity=item.opportunity,
                recommendedAmount=round(amount, 2),
                allocationPercent=round(amount / request.monthlyBudget * 100, 2),
                reason=_recommendation_reason(item.opportunity.suggestedAction),
            )
        )

    allocated = sum(item.recommendedAmount for item in recommendations)
    return PortfolioRecommendationResponse(
        monthlyBudget=round(request.monthlyBudget, 2),
        allocatedAmount=round(allocated, 2),
        keepCashAmount=round(request.monthlyBudget - allocated, 2),
        recommendations=recommendations,
    )


def _recommendation_reason(action: str) -> str:
    if action == "DEPLOY_RESERVE":
        return "High score with active reserve deployment signal"
    if action == "ACCUMULATE":
        return "Actionable accumulation signal above minimum score"
    return "Score is above threshold; keep on allocation shortlist"
