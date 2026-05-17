import pandas as pd
from fastapi import status

from app.models.backtest import (
    AssetSummary,
    BacktestRequest,
    BacktestStrategyId,
    BacktestResponse,
    ChartPoint,
    DateRange,
    InvestmentEvent,
    MetricsComparison,
    StrategyMetrics,
    StrategyResult,
)
from app.services.api_errors import api_error
from app.services.buy_the_dip import simulate_buy_the_dip
from app.services.indicators import add_momentum_average, add_moving_average, add_rsi
from app.services.asset_registry import fetch_registered_price_history, get_registered_asset_info
from app.services.metrics import calculate_metrics, calculate_reserve_metrics
from app.services.momentum_boost import simulate_momentum_boost
from app.services.opportunity import evaluate_opportunity
from app.services.reserve_buy_the_dip import simulate_reserve_buy_the_dip
from app.services.rsi_dip import simulate_rsi_dip
from app.services.sip import simulate_regular_sip


STRATEGY_META = {
    BacktestStrategyId.REGULAR_SIP: ("Regular SIP", "regularSipValue"),
    BacktestStrategyId.BUY_THE_DIP: ("Buy the Dip", "buyTheDipValue"),
    BacktestStrategyId.RESERVE_BUY_THE_DIP: ("Reserve-Aware Buy the Dip", "reserveAwareBuyTheDipValue"),
    BacktestStrategyId.RSI_DIP: ("RSI Dip", "rsiDipValue"),
    BacktestStrategyId.MOMENTUM_BOOST: ("Momentum Boost", "momentumBoostValue"),
}


def run_backtest(request: BacktestRequest) -> BacktestResponse:
    start = pd.to_datetime(request.start_date)
    end = pd.to_datetime(request.end_date)
    if start >= end:
        raise api_error("INVALID_DATE_RANGE", "startDate must be before endDate.")

    try:
        prices = fetch_registered_price_history(
            request.asset_type,
            request.resolved_asset_id,
            request.start_date,
            request.end_date,
            request.strategy.moving_average_days,
            request.currency,
        )
    except Exception:
        raise

    prices = add_moving_average(prices, request.strategy.moving_average_days)
    prices = add_rsi(prices, request.strategy.rsi.period)
    prices = add_momentum_average(prices, request.strategy.momentum.moving_average_days)
    backtest_prices = prices[(prices["date"] >= start) & (prices["date"] <= end)].reset_index(drop=True)
    if backtest_prices.empty:
        raise api_error(
            "NO_PRICE_DATA",
            f"No historical price data found for asset {request.resolved_asset_id} in the selected date range.",
            status.HTTP_404_NOT_FOUND,
        )

    regular_events, regular_portfolio = simulate_regular_sip(backtest_prices, request.monthly_amount)
    dip_events, dip_portfolio = simulate_buy_the_dip(
        backtest_prices,
        request.monthly_amount,
        request.strategy.dip_threshold_percent,
        request.strategy.deploy_multiplier,
    )
    reserve_events, reserve_portfolio = simulate_reserve_buy_the_dip(
        backtest_prices,
        request.monthly_amount,
        request.strategy.dip_threshold_percent,
        request.strategy.deploy_multiplier,
        request.strategy.reserve.enabled,
        request.strategy.reserve.base_sip_percent,
    )
    rsi_events, rsi_portfolio = simulate_rsi_dip(
        backtest_prices,
        request.monthly_amount,
        request.strategy.rsi.threshold,
        request.strategy.deploy_multiplier,
    )
    momentum_events, momentum_portfolio = simulate_momentum_boost(
        backtest_prices,
        request.monthly_amount,
        request.strategy.deploy_multiplier,
    )

    regular_metrics = StrategyMetrics(**calculate_metrics(regular_events, regular_portfolio))
    dip_metrics = StrategyMetrics(**calculate_metrics(dip_events, dip_portfolio))
    reserve_metrics = StrategyMetrics(
        **calculate_reserve_metrics(reserve_events, reserve_portfolio, request.monthly_amount)
    )
    rsi_metrics = StrategyMetrics(**calculate_metrics(rsi_events, rsi_portfolio))
    momentum_metrics = StrategyMetrics(**calculate_metrics(momentum_events, momentum_portfolio))

    events_by_strategy = {
        BacktestStrategyId.REGULAR_SIP: regular_events,
        BacktestStrategyId.BUY_THE_DIP: dip_events,
        BacktestStrategyId.RESERVE_BUY_THE_DIP: reserve_events,
        BacktestStrategyId.RSI_DIP: rsi_events,
        BacktestStrategyId.MOMENTUM_BOOST: momentum_events,
    }
    metrics_by_strategy = {
        BacktestStrategyId.REGULAR_SIP: regular_metrics,
        BacktestStrategyId.BUY_THE_DIP: dip_metrics,
        BacktestStrategyId.RESERVE_BUY_THE_DIP: reserve_metrics,
        BacktestStrategyId.RSI_DIP: rsi_metrics,
        BacktestStrategyId.MOMENTUM_BOOST: momentum_metrics,
    }
    opportunity = evaluate_opportunity(backtest_prices, request, {key.value: value for key, value in metrics_by_strategy.items()})

    asset_info = get_registered_asset_info(request.asset_type, request.resolved_asset_id)

    return BacktestResponse(
        asset=AssetSummary(
            assetType=request.asset_type,
            assetId=request.resolved_asset_id,
            ticker=asset_info.ticker,
            name=asset_info.name,
            currency=request.currency or asset_info.currency,
        ),
        dateRange=DateRange(startDate=request.start_date, endDate=request.end_date),
        metrics=MetricsComparison(
            regularSip=regular_metrics,
            buyTheDip=dip_metrics,
            reserveAwareBuyTheDip=reserve_metrics,
        ),
        chart=_build_chart(
            backtest_prices,
            regular_portfolio,
            dip_portfolio,
            reserve_portfolio,
            rsi_portfolio,
            momentum_portfolio,
        ),
        events=[
            InvestmentEvent(**event)
            for event in sorted(
                _selected_events(request.enabled_strategies, events_by_strategy),
                key=lambda item: item["date"],
                reverse=True,
            )
        ],
        strategies=_build_strategy_results(request.enabled_strategies, metrics_by_strategy, events_by_strategy),
        opportunity=opportunity,
    )


def _build_chart(
    prices: pd.DataFrame,
    regular_portfolio: list[dict],
    dip_portfolio: list[dict],
    reserve_portfolio: list[dict],
    rsi_portfolio: list[dict],
    momentum_portfolio: list[dict],
) -> list[ChartPoint]:
    regular_values = {point["date"]: point["value"] for point in regular_portfolio}
    dip_values = {point["date"]: point["value"] for point in dip_portfolio}
    reserve_values = {point["date"]: point["value"] for point in reserve_portfolio}
    cash_reserve_values = {point["date"]: point.get("cash_reserve", 0) for point in reserve_portfolio}
    rsi_values = {point["date"]: point["value"] for point in rsi_portfolio}
    momentum_values = {point["date"]: point["value"] for point in momentum_portfolio}

    points: list[ChartPoint] = []
    for row in prices.itertuples(index=False):
        date = pd.Timestamp(row.date).date().isoformat()
        points.append(
            ChartPoint(
                date=date,
                price=round(float(row.price), 4),
                regularSipValue=round(float(regular_values.get(date, 0)), 2),
                buyTheDipValue=round(float(dip_values.get(date, 0)), 2),
                reserveAwareBuyTheDipValue=round(float(reserve_values.get(date, 0)), 2),
                cashReserveValue=round(float(cash_reserve_values.get(date, 0)), 2),
                rsiDipValue=round(float(rsi_values.get(date, 0)), 2),
                momentumBoostValue=round(float(momentum_values.get(date, 0)), 2),
            )
        )
    return points


def _selected_events(
    enabled_strategies: list[BacktestStrategyId],
    events_by_strategy: dict[BacktestStrategyId, list[dict]],
) -> list[dict]:
    events: list[dict] = []
    for strategy_id in enabled_strategies:
        events.extend(events_by_strategy[strategy_id])
    return events


def _build_strategy_results(
    enabled_strategies: list[BacktestStrategyId],
    metrics_by_strategy: dict[BacktestStrategyId, StrategyMetrics],
    events_by_strategy: dict[BacktestStrategyId, list[dict]],
) -> list[StrategyResult]:
    results: list[StrategyResult] = []
    for strategy_id in enabled_strategies:
        label, chart_key = STRATEGY_META[strategy_id]
        results.append(
            StrategyResult(
                id=strategy_id,
                label=label,
                chartKey=chart_key,
                metrics=metrics_by_strategy[strategy_id],
                events=[InvestmentEvent(**event) for event in events_by_strategy[strategy_id]],
            )
        )
    return results
