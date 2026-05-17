from fastapi import APIRouter

from app.models.backtest import BacktestRequest, BacktestResponse
from app.services.backtest_service import run_backtest

router = APIRouter(tags=["backtests"])


@router.post("/backtests", response_model=BacktestResponse)
def create_backtest(request: BacktestRequest) -> BacktestResponse:
    return run_backtest(request)
