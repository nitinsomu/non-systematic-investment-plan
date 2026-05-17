import pandas as pd


def monthly_investment_rows(prices: pd.DataFrame) -> pd.DataFrame:
    monthly = prices.copy()
    monthly["month"] = monthly["date"].dt.to_period("M")
    return monthly.groupby("month", as_index=False).first()


def simulate_regular_sip(prices: pd.DataFrame, monthly_amount: float) -> tuple[list[dict], list[dict]]:
    investment_dates = set(monthly_investment_rows(prices)["date"])
    total_units = 0.0
    events: list[dict] = []
    portfolio: list[dict] = []

    for row in prices.itertuples(index=False):
        date = pd.Timestamp(row.date)
        price = float(row.price)
        if date in investment_dates:
            units = monthly_amount / price
            total_units += units
            events.append(
                {
                    "date": date.date().isoformat(),
                    "strategy": "REGULAR_SIP",
                    "price": round(price, 4),
                    "amountInvested": round(monthly_amount, 2),
                    "unitsBought": round(units, 6),
                    "reason": "Monthly SIP investment",
                }
            )
        portfolio.append({"date": date.date().isoformat(), "value": total_units * price})

    return events, portfolio
