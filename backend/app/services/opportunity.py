import math

import pandas as pd

from app.models.backtest import BacktestRequest, Opportunity, OpportunitySignals, StrategyMetrics


def evaluate_opportunity(
    prices: pd.DataFrame,
    request: BacktestRequest,
    strategy_metrics: dict[str, StrategyMetrics] | None = None,
) -> Opportunity:
    latest = prices.iloc[-1]
    price = float(latest["price"])
    moving_average = _value_or_none(latest.get("moving_average"))
    rsi = _value_or_none(latest.get("rsi"))
    momentum_average = _value_or_none(latest.get("momentum_average"))
    as_of_date = pd.Timestamp(latest["date"]).date().isoformat()

    dip_percent = ((moving_average - price) / moving_average * 100) if moving_average else 0.0
    dip_triggered = bool(moving_average and dip_percent >= request.strategy.dip_threshold_percent)
    rsi_triggered = bool(rsi is not None and rsi < request.strategy.rsi.threshold)
    momentum_triggered = bool(momentum_average and price > momentum_average)

    score = 50
    reasons: list[str] = []
    risks: list[str] = []

    if moving_average:
        if dip_percent > 0:
            score += min(20, int(dip_percent * 2))
            reasons.append(f"Price is {dip_percent:.1f}% below the {request.strategy.moving_average_days}-day moving average")
        else:
            premium = abs(dip_percent)
            score -= min(20, int(premium * 1.5))
            risks.append(f"Price is {premium:.1f}% above the {request.strategy.moving_average_days}-day moving average")

    if rsi is not None:
        reasons.append(f"RSI is {rsi:.1f}")
        if rsi < request.strategy.rsi.threshold:
            score += 18
        elif rsi < request.strategy.rsi.threshold + 10:
            score += 8
        elif rsi >= 70:
            score -= 22
            risks.append("RSI is overheated")

    if momentum_average:
        if momentum_triggered:
            score += 8
            reasons.append("Price is above the momentum average")
        elif not dip_triggered:
            score -= 8
            risks.append("Momentum is still weak")

    if strategy_metrics:
        regular = strategy_metrics.get("REGULAR_SIP")
        for key, label in [
            ("BUY_THE_DIP", "Buy the Dip"),
            ("RESERVE_BUY_THE_DIP", "Reserve-aware strategy"),
            ("RSI_DIP", "RSI Dip"),
            ("MOMENTUM_BOOST", "Momentum Boost"),
        ]:
            metric = strategy_metrics.get(key)
            if regular and metric and metric.currentValue > regular.currentValue:
                score += 5
                reasons.append(f"{label} outperformed Regular SIP in this backtest")
                break

    if not any([dip_triggered, rsi_triggered, momentum_triggered]):
        score -= 12
        risks.append("No selected strategy signal is currently triggered")

    reserve_enabled = request.strategy.reserve.enabled
    suggested_action = "WATCH"
    suggested_amount = request.monthly_amount
    if rsi is not None and rsi >= 70:
        suggested_action = "AVOID_CHASING"
        suggested_amount = 0
    elif reserve_enabled and dip_triggered:
        suggested_action = "DEPLOY_RESERVE"
        suggested_amount = request.monthly_amount * request.strategy.deploy_multiplier
    elif dip_triggered or rsi_triggered:
        suggested_action = "ACCUMULATE"
        suggested_amount = request.monthly_amount * request.strategy.deploy_multiplier

    score = max(0, min(100, score))
    label = _score_label(score)
    summary = _summary(label, dip_triggered, rsi_triggered, momentum_triggered)
    if not risks:
        risks.append("Signal does not guarantee near-term recovery")

    return Opportunity(
        score=score,
        label=label,
        suggestedAction=suggested_action,
        suggestedAmount=round(suggested_amount, 2),
        summary=summary,
        reasons=reasons[:5],
        risks=risks[:4],
        signals=OpportunitySignals(
            dipTriggered=dip_triggered,
            rsiTriggered=rsi_triggered,
            momentumTriggered=momentum_triggered,
        ),
        asOfDate=as_of_date,
    )


def _value_or_none(value: object) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(parsed) else parsed


def _score_label(score: int) -> str:
    if score >= 85:
        return "Very Strong"
    if score >= 70:
        return "Strong"
    if score >= 55:
        return "Interesting"
    if score >= 40:
        return "Neutral"
    return "Weak"


def _summary(label: str, dip: bool, rsi: bool, momentum: bool) -> str:
    active = []
    if dip:
        active.append("dip")
    if rsi:
        active.append("RSI")
    if momentum:
        active.append("momentum")
    if active:
        return f"{label} setup with active {'/'.join(active)} signal context."
    return f"{label} setup with no major signal currently triggered."
