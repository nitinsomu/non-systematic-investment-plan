import math

import pandas as pd

from app.services.sip import monthly_investment_rows


def simulate_rsi_dip(
    prices: pd.DataFrame,
    monthly_amount: float,
    rsi_threshold: float,
    deploy_multiplier: float,
) -> tuple[list[dict], list[dict]]:
    investment_dates = set(monthly_investment_rows(prices)["date"])
    total_units = 0.0
    events: list[dict] = []
    portfolio: list[dict] = []

    for row in prices.itertuples(index=False):
        date = pd.Timestamp(row.date)
        price = float(row.price)
        rsi = float(row.rsi) if not math.isnan(float(row.rsi)) else None
        amount = monthly_amount
        reason = "Monthly base investment; RSI window not available yet"

        if rsi is not None:
            if rsi < rsi_threshold:
                amount = monthly_amount * deploy_multiplier
                reason = f"RSI was {rsi:.1f}, below threshold {rsi_threshold:g}"
            else:
                reason = "Monthly base investment; RSI threshold not crossed"

        if date in investment_dates:
            units = amount / price
            total_units += units
            events.append(
                {
                    "date": date.date().isoformat(),
                    "strategy": "RSI_DIP",
                    "price": round(price, 4),
                    "amountInvested": round(amount, 2),
                    "unitsBought": round(units, 6),
                    "reason": reason,
                }
            )

        portfolio.append({"date": date.date().isoformat(), "value": total_units * price})

    return events, portfolio
