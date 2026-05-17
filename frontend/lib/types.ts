export type StrategyType = "BUY_THE_DIP";
export type AssetType = "STOCK" | "MUTUAL_FUND" | "ETF" | "GOLD" | "CRYPTO";
export type BacktestStrategyId =
  | "REGULAR_SIP"
  | "BUY_THE_DIP"
  | "RESERVE_BUY_THE_DIP"
  | "RSI_DIP"
  | "MOMENTUM_BOOST";

export type AssetInfo = {
  assetType: AssetType;
  assetId: string;
  ticker: string;
  name: string;
  currency: string;
  exchange?: string | null;
  latestPrice?: number | null;
  latestPriceDate?: string | null;
};

export type AssetSearchResult = {
  assetType: AssetType;
  assetId: string;
  ticker: string;
  name: string;
  currency: string;
  latestPrice?: number | null;
  latestPriceDate?: string | null;
};

export type BacktestRequest = {
  enabledStrategies: BacktestStrategyId[];
  assetType: AssetType;
  assetId: string;
  ticker?: string;
  monthlyAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  strategy: {
    type: StrategyType;
    dipThresholdPercent: number;
    movingAverageDays: number;
    deployMultiplier: number;
    reserve: {
      enabled: boolean;
      baseSipPercent: number;
    };
    rsi: {
      period: number;
      threshold: number;
    };
    momentum: {
      movingAverageDays: number;
    };
  };
};

export type StrategyMetrics = {
  totalInvested: number;
  currentValue: number;
  absoluteGain: number;
  returnPercent: number;
  xirr: number | null;
  numberOfInvestments: number;
  endingCashReserve?: number | null;
  reserveDeployed?: number | null;
};

export type InvestmentEvent = {
  date: string;
  strategy: BacktestStrategyId;
  price: number;
  amountInvested: number;
  unitsBought: number;
  reason: string;
  reserveContribution?: number | null;
  reserveDeployed?: number | null;
  cashReserveBalance?: number | null;
};

export type Opportunity = {
  score: number;
  label: string;
  suggestedAction: "AVOID_CHASING" | "WATCH" | "ACCUMULATE" | "DEPLOY_RESERVE" | string;
  suggestedAmount: number;
  summary: string;
  reasons: string[];
  risks: string[];
  signals: {
    dipTriggered: boolean;
    rsiTriggered: boolean;
    momentumTriggered: boolean;
  };
  asOfDate: string;
};

export type WatchlistItem = {
  id: string;
  assetType: AssetType;
  assetId: string;
  ticker: string;
  name: string;
  currency: string;
  monthlyAmount: number;
  enabledStrategies: BacktestStrategyId[];
  strategy: BacktestRequest["strategy"];
  createdAt: string;
};

export type WatchlistItemCreate = Omit<WatchlistItem, "id" | "createdAt">;

export type WatchlistEvaluationItem = {
  watchlistItem: WatchlistItem;
  opportunity: Opportunity;
  alert: {
    alertStatus: string;
    alertLevel: "BUY" | "AVOID" | "WATCH" | "NONE" | string;
    isActionable: boolean;
    alertReason: string;
  };
  lastEvaluatedAt: string;
};

export type WatchlistEvaluationResponse = {
  items: WatchlistEvaluationItem[];
  summary: {
    total: number;
    buy: number;
    avoid: number;
    watch: number;
    none: number;
  };
};

export type PortfolioRecommendationRequest = {
  monthlyBudget: number;
  maxPerAssetPercent: number;
  minimumScore: number;
};

export type PortfolioRecommendationResponse = {
  monthlyBudget: number;
  allocatedAmount: number;
  keepCashAmount: number;
  recommendations: Array<{
    watchlistItem: WatchlistItem;
    opportunity: Opportunity;
    recommendedAmount: number;
    allocationPercent: number;
    reason: string;
  }>;
};

export type BacktestResponse = {
  asset: {
    assetType: AssetType;
    assetId: string;
    ticker: string;
    name: string;
    currency: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    regularSip: StrategyMetrics;
    buyTheDip: StrategyMetrics;
    reserveAwareBuyTheDip: StrategyMetrics;
  };
  opportunity: Opportunity;
  strategies: Array<{
    id: BacktestStrategyId;
    label: string;
    chartKey: string;
    metrics: StrategyMetrics;
    events: InvestmentEvent[];
  }>;
  chart: Array<{
    date: string;
    price: number;
    regularSipValue: number;
    buyTheDipValue: number;
    reserveAwareBuyTheDipValue: number;
    cashReserveValue: number;
    rsiDipValue: number;
    momentumBoostValue: number;
  }>;
  events: InvestmentEvent[];
};
