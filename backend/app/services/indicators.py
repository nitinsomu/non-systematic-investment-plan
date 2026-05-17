import pandas as pd


def add_moving_average(prices: pd.DataFrame, window: int) -> pd.DataFrame:
    with_average = prices.copy()
    with_average["moving_average"] = with_average["price"].rolling(window=window, min_periods=window).mean()
    return with_average


def add_rsi(prices: pd.DataFrame, period: int) -> pd.DataFrame:
    with_rsi = prices.copy()
    delta = with_rsi["price"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    average_gain = gain.rolling(window=period, min_periods=period).mean()
    average_loss = loss.rolling(window=period, min_periods=period).mean()
    relative_strength = average_gain / average_loss
    with_rsi["rsi"] = 100 - (100 / (1 + relative_strength))
    with_rsi.loc[(average_loss == 0) & (average_gain > 0), "rsi"] = 100
    with_rsi.loc[(average_loss == 0) & (average_gain == 0), "rsi"] = 50
    return with_rsi


def add_momentum_average(prices: pd.DataFrame, window: int) -> pd.DataFrame:
    with_average = prices.copy()
    with_average["momentum_average"] = with_average["price"].rolling(window=window, min_periods=window).mean()
    return with_average
