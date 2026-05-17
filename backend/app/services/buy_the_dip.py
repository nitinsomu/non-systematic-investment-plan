import math

import pandas as pd

from app.services.sip import monthly_investment_rows


def simulate_buy_the_dip(
    prices: pd.DataFrame,
    monthly_amount: float,
    dip_threshold_percent: float,
    deploy_multiplier: float,
) -> tuple[list[dict], list[dict]]:
    investment_dates = set(monthly_investment_rows(prices)["date"])
    total_units = 0.0
    events: list[dict] = []
    portfolio: list[dict] = []

    for row in prices.itertuples(index=False):
        date = pd.Timestamp(row.date)
        price = float(row.price)
        moving_average = float(row.moving_average) if not math.isnan(float(row.moving_average)) else None
        amount = monthly_amount
        reason = "Monthly base investment; moving average window not available yet"

        if moving_average is not None:
            dip_percent = ((moving_average - price) / moving_average) * 100
            if dip_percent >= dip_threshold_percent:
                amount = monthly_amount * deploy_multiplier
                reason = f"Price was {dip_percent:.1f}% below moving average"
            else:
                reason = "Monthly base investment; dip threshold not crossed"

        if date in investment_dates:
            units = amount / price
            total_units += units
            events.append(
                {
                    "date": date.date().isoformat(),
                    "strategy": "BUY_THE_DIP",
                    "price": round(price, 4),
                    "amountInvested": round(amount, 2),
                    "unitsBought": round(units, 6),
                    "reason": reason,
                }
            )

        portfolio.append({"date": date.date().isoformat(), "value": total_units * price})

    return events, portfolio
