import math

import pandas as pd

from app.services.sip import monthly_investment_rows


def simulate_momentum_boost(
    prices: pd.DataFrame,
    monthly_amount: float,
    deploy_multiplier: float,
) -> tuple[list[dict], list[dict]]:
    investment_dates = set(monthly_investment_rows(prices)["date"])
    total_units = 0.0
    events: list[dict] = []
    portfolio: list[dict] = []

    for row in prices.itertuples(index=False):
        date = pd.Timestamp(row.date)
        price = float(row.price)
        momentum_average = (
            float(row.momentum_average) if not math.isnan(float(row.momentum_average)) else None
        )
        amount = monthly_amount
        reason = "Monthly base investment; momentum average not available yet"

        if momentum_average is not None:
            if price > momentum_average:
                amount = monthly_amount * deploy_multiplier
                reason = f"Price was above momentum average ({momentum_average:.2f})"
            else:
                reason = "Monthly base investment; price was not above momentum average"

        if date in investment_dates:
            units = amount / price
            total_units += units
            events.append(
                {
                    "date": date.date().isoformat(),
                    "strategy": "MOMENTUM_BOOST",
                    "price": round(price, 4),
                    "amountInvested": round(amount, 2),
                    "unitsBought": round(units, 6),
                    "reason": reason,
                }
            )

        portfolio.append({"date": date.date().isoformat(), "value": total_units * price})

    return events, portfolio
