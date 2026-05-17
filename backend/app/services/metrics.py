import pandas as pd
import pyxirr


def calculate_metrics(events: list[dict], portfolio: list[dict]) -> dict:
    total_invested = sum(float(event["amountInvested"]) for event in events)
    current_value = float(portfolio[-1]["value"]) if portfolio else 0.0
    absolute_gain = current_value - total_invested
    return_percent = (absolute_gain / total_invested * 100) if total_invested else 0.0
    xirr_value = _calculate_xirr(events, current_value, portfolio[-1]["date"] if portfolio else None)

    return {
        "totalInvested": round(total_invested, 2),
        "currentValue": round(current_value, 2),
        "absoluteGain": round(absolute_gain, 2),
        "returnPercent": round(return_percent, 2),
        "xirr": round(xirr_value * 100, 2) if xirr_value is not None else None,
        "numberOfInvestments": len(events),
    }


def calculate_reserve_metrics(events: list[dict], portfolio: list[dict], monthly_budget: float) -> dict:
    total_budget_committed = len(events) * monthly_budget
    current_value = float(portfolio[-1]["value"]) if portfolio else 0.0
    ending_cash_reserve = float(portfolio[-1].get("cash_reserve", 0)) if portfolio else 0.0
    reserve_deployed = sum(float(event.get("reserveDeployed", 0) or 0) for event in events)
    absolute_gain = current_value - total_budget_committed
    return_percent = (absolute_gain / total_budget_committed * 100) if total_budget_committed else 0.0
    xirr_value = _calculate_budget_xirr(events, monthly_budget, current_value, portfolio[-1]["date"] if portfolio else None)

    return {
        "totalInvested": round(total_budget_committed, 2),
        "currentValue": round(current_value, 2),
        "absoluteGain": round(absolute_gain, 2),
        "returnPercent": round(return_percent, 2),
        "xirr": round(xirr_value * 100, 2) if xirr_value is not None else None,
        "numberOfInvestments": len(events),
        "endingCashReserve": round(ending_cash_reserve, 2),
        "reserveDeployed": round(reserve_deployed, 2),
    }


def _calculate_xirr(events: list[dict], current_value: float, final_date: str | None) -> float | None:
    if not events or not final_date or current_value <= 0:
        return None

    dates = [pd.Timestamp(event["date"]).date() for event in events]
    amounts = [-float(event["amountInvested"]) for event in events]
    dates.append(pd.Timestamp(final_date).date())
    amounts.append(current_value)

    try:
        return float(pyxirr.xirr(dates, amounts))
    except Exception:
        return None


def _calculate_budget_xirr(
    events: list[dict],
    monthly_budget: float,
    current_value: float,
    final_date: str | None,
) -> float | None:
    if not events or not final_date or current_value <= 0:
        return None

    dates = [pd.Timestamp(event["date"]).date() for event in events]
    amounts = [-float(monthly_budget) for _ in events]
    dates.append(pd.Timestamp(final_date).date())
    amounts.append(current_value)

    try:
        return float(pyxirr.xirr(dates, amounts))
    except Exception:
        return None
