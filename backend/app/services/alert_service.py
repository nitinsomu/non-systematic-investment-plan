from app.models.backtest import Opportunity
from app.models.watchlist import Alert, AlertSummary, WatchlistEvaluationItem


def build_alert(opportunity: Opportunity) -> Alert:
    action = opportunity.suggestedAction
    if action in {"ACCUMULATE", "DEPLOY_RESERVE"}:
        return Alert(
            alertStatus="ACTIVE",
            alertLevel="BUY",
            isActionable=True,
            alertReason="Strong opportunity score with active buy signal",
        )
    if action == "AVOID_CHASING":
        return Alert(
            alertStatus="ACTIVE",
            alertLevel="AVOID",
            isActionable=True,
            alertReason="Asset appears overheated; avoid chasing",
        )
    if opportunity.score >= 40:
        return Alert(
            alertStatus="WATCHING",
            alertLevel="WATCH",
            isActionable=False,
            alertReason="Moderate score without an actionable signal",
        )
    return Alert(
        alertStatus="INACTIVE",
        alertLevel="NONE",
        isActionable=False,
        alertReason="Weak score and no current signal",
    )


def summarize_alerts(items: list[WatchlistEvaluationItem]) -> AlertSummary:
    counts = {"BUY": 0, "AVOID": 0, "WATCH": 0, "NONE": 0}
    for item in items:
        counts[item.alert.alertLevel] = counts.get(item.alert.alertLevel, 0) + 1
    return AlertSummary(
        total=len(items),
        buy=counts["BUY"],
        avoid=counts["AVOID"],
        watch=counts["WATCH"],
        none=counts["NONE"],
    )
