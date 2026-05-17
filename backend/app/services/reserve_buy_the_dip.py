import math

import pandas as pd

from app.services.sip import monthly_investment_rows


def simulate_reserve_buy_the_dip(
    prices: pd.DataFrame,
    monthly_amount: float,
    dip_threshold_percent: float,
    deploy_multiplier: float,
    reserve_enabled: bool,
    base_sip_percent: float,
) -> tuple[list[dict], list[dict]]:
    investment_dates = set(monthly_investment_rows(prices)["date"])
    base_investment = monthly_amount if not reserve_enabled else monthly_amount * (base_sip_percent / 100)
    reserve_contribution = 0.0 if not reserve_enabled else monthly_amount - base_investment
    cash_reserve = 0.0
    total_units = 0.0
    events: list[dict] = []
    portfolio: list[dict] = []

    for row in prices.itertuples(index=False):
        date = pd.Timestamp(row.date)
        price = float(row.price)
        moving_average = float(row.moving_average) if not math.isnan(float(row.moving_average)) else None

        if date in investment_dates:
            cash_reserve += reserve_contribution
            amount = base_investment
            reserve_deployed = 0.0
            reason = "Base SIP invested; reserve contribution added"

            if reserve_enabled and moving_average is not None:
                dip_percent = ((moving_average - price) / moving_average) * 100
                if dip_percent >= dip_threshold_percent:
                    target_amount = monthly_amount * deploy_multiplier
                    extra_needed = max(0.0, target_amount - base_investment)
                    reserve_deployed = min(extra_needed, cash_reserve)
                    amount += reserve_deployed
                    cash_reserve -= reserve_deployed
                    reason = (
                        f"Price was {dip_percent:.1f}% below moving average; "
                        f"deployed reserve up to target multiplier"
                    )
                else:
                    reason = "Base SIP invested; reserve held because dip threshold was not crossed"
            elif reserve_enabled:
                reason = "Base SIP invested; reserve held until moving average window is available"

            units = amount / price
            total_units += units
            events.append(
                {
                    "date": date.date().isoformat(),
                    "strategy": "RESERVE_BUY_THE_DIP",
                    "price": round(price, 4),
                    "amountInvested": round(amount, 2),
                    "unitsBought": round(units, 6),
                    "reason": reason,
                    "reserveContribution": round(reserve_contribution, 2),
                    "reserveDeployed": round(reserve_deployed, 2),
                    "cashReserveBalance": round(cash_reserve, 2),
                }
            )

        asset_value = total_units * price
        portfolio.append(
            {
                "date": date.date().isoformat(),
                "value": asset_value + cash_reserve,
                "asset_value": asset_value,
                "cash_reserve": cash_reserve,
            }
        )

    return events, portfolio
