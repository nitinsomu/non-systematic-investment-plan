from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.asset import AssetType


class StrategyType(StrEnum):
    BUY_THE_DIP = "BUY_THE_DIP"


class BacktestStrategyId(StrEnum):
    REGULAR_SIP = "REGULAR_SIP"
    BUY_THE_DIP = "BUY_THE_DIP"
    RESERVE_BUY_THE_DIP = "RESERVE_BUY_THE_DIP"
    RSI_DIP = "RSI_DIP"
    MOMENTUM_BOOST = "MOMENTUM_BOOST"


DEFAULT_ENABLED_STRATEGIES = [
    BacktestStrategyId.REGULAR_SIP,
    BacktestStrategyId.BUY_THE_DIP,
    BacktestStrategyId.RESERVE_BUY_THE_DIP,
    BacktestStrategyId.RSI_DIP,
    BacktestStrategyId.MOMENTUM_BOOST,
]


class ReserveConfig(BaseModel):
    enabled: bool = True
    base_sip_percent: float = Field(default=50, alias="baseSipPercent", gt=0, lt=100)

    model_config = ConfigDict(populate_by_name=True)


class RsiConfig(BaseModel):
    period: int = Field(default=14, ge=2)
    threshold: float = Field(default=30, gt=0, lt=100)


class MomentumConfig(BaseModel):
    moving_average_days: int = Field(default=50, alias="movingAverageDays", ge=5)

    model_config = ConfigDict(populate_by_name=True)


class StrategyConfig(BaseModel):
    type: StrategyType = StrategyType.BUY_THE_DIP
    dip_threshold_percent: float = Field(alias="dipThresholdPercent", gt=0)
    moving_average_days: int = Field(alias="movingAverageDays", ge=20)
    deploy_multiplier: float = Field(alias="deployMultiplier", ge=1)
    reserve: ReserveConfig = Field(default_factory=ReserveConfig)
    rsi: RsiConfig = Field(default_factory=RsiConfig)
    momentum: MomentumConfig = Field(default_factory=MomentumConfig)

    model_config = ConfigDict(populate_by_name=True)


class BacktestRequest(BaseModel):
    enabled_strategies: list[BacktestStrategyId] = Field(
        default_factory=lambda: DEFAULT_ENABLED_STRATEGIES.copy(),
        alias="enabledStrategies",
    )
    asset_type: AssetType = Field(default=AssetType.STOCK, alias="assetType")
    asset_id: str | None = Field(default=None, alias="assetId")
    ticker: str | None = Field(default=None, min_length=1)
    monthly_amount: float = Field(alias="monthlyAmount", gt=0)
    currency: str = Field(default="INR", min_length=1)
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    strategy: StrategyConfig

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("asset_id", "ticker", "currency", mode="before")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip().upper()

    @model_validator(mode="after")
    def validate_dates(self) -> "BacktestRequest":
        if self.start_date >= self.end_date:
            raise ValueError("startDate must be before endDate")
        if not self.asset_id and not self.ticker:
            raise ValueError("assetId or ticker is required")
        return self

    @property
    def resolved_asset_id(self) -> str:
        return self.asset_id or self.ticker or ""


class AssetSummary(BaseModel):
    assetType: AssetType
    assetId: str
    ticker: str
    name: str
    currency: str


class DateRange(BaseModel):
    startDate: str
    endDate: str


class StrategyMetrics(BaseModel):
    totalInvested: float
    currentValue: float
    absoluteGain: float
    returnPercent: float
    xirr: float | None
    numberOfInvestments: int
    endingCashReserve: float | None = None
    reserveDeployed: float | None = None


class OpportunitySignals(BaseModel):
    dipTriggered: bool
    rsiTriggered: bool
    momentumTriggered: bool


class Opportunity(BaseModel):
    score: int
    label: str
    suggestedAction: str
    suggestedAmount: float
    summary: str
    reasons: list[str]
    risks: list[str]
    signals: OpportunitySignals
    asOfDate: str


class MetricsComparison(BaseModel):
    regularSip: StrategyMetrics
    buyTheDip: StrategyMetrics
    reserveAwareBuyTheDip: StrategyMetrics


class ChartPoint(BaseModel):
    date: str
    price: float
    regularSipValue: float
    buyTheDipValue: float
    reserveAwareBuyTheDipValue: float
    cashReserveValue: float
    rsiDipValue: float
    momentumBoostValue: float


class InvestmentEvent(BaseModel):
    date: str
    strategy: str
    price: float
    amountInvested: float
    unitsBought: float
    reason: str
    reserveContribution: float | None = None
    reserveDeployed: float | None = None
    cashReserveBalance: float | None = None


class StrategyResult(BaseModel):
    id: BacktestStrategyId
    label: str
    chartKey: str
    metrics: StrategyMetrics
    events: list[InvestmentEvent]


class BacktestResponse(BaseModel):
    asset: AssetSummary
    dateRange: DateRange
    metrics: MetricsComparison
    chart: list[ChartPoint]
    events: list[InvestmentEvent]
    strategies: list[StrategyResult]
    opportunity: Opportunity
