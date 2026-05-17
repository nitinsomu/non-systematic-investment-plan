const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StockInfo {
  ticker: string;
  name: string;
  currency: string;
  current_price: number | null;
}

export interface PortfolioPoint {
  date: string;
  value: number;
  invested: number;
}

export interface StrategyResult {
  total_invested: number;
  final_value: number;
  xirr: number | null;
  num_investments: number;
  portfolio_history: PortfolioPoint[];
  dip_triggers?: number;
}

export interface BacktestResponse {
  ticker: string;
  sip: StrategyResult;
  dip: StrategyResult;
}

export async function searchStock(q: string): Promise<StockInfo> {
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Stock not found");
  return res.json();
}

export interface BacktestParams {
  ticker: string;
  start_date: string;
  end_date: string;
  monthly_amount: number;
  dip_pct: number;
  deploy_multiplier: number;
}

export async function runBacktest(params: BacktestParams): Promise<BacktestResponse> {
  const res = await fetch(`${API_BASE}/api/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Backtest failed");
  }
  return res.json();
}
