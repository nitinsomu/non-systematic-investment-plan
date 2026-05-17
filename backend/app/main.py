from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.routes_assets import router as assets_router
from app.api.v1.routes_backtests import router as backtests_router
from app.api.v1.routes_portfolio import router as portfolio_router
from app.api.v1.routes_watchlist import router as watchlist_router
from app.core.config import settings

app = FastAPI(title="NSIP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first_error = exc.errors()[0] if exc.errors() else {}
    message = str(first_error.get("msg", "Invalid request."))
    code = "INVALID_DATE_RANGE" if "startDate must be before endDate" in message else "INVALID_STRATEGY_CONFIG"
    return JSONResponse(status_code=422, content={"detail": {"code": code, "message": message}})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(assets_router, prefix="/api/v1")
app.include_router(backtests_router, prefix="/api/v1")
app.include_router(watchlist_router, prefix="/api/v1")
app.include_router(portfolio_router, prefix="/api/v1")
