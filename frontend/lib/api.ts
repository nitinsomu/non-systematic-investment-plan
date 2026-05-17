import type {
  AssetInfo,
  AssetSearchResult,
  AssetType,
  BacktestRequest,
  BacktestResponse,
  PortfolioRecommendationRequest,
  PortfolioRecommendationResponse,
  WatchlistEvaluationResponse,
  WatchlistItem,
  WatchlistItemCreate,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.detail?.message ??
      body?.detail?.[0]?.msg ??
      body?.detail ??
      "The request failed. Check the backend and try again.";
    throw new Error(String(message));
  }

  return body as T;
}

export async function getAsset(ticker: string): Promise<AssetInfo> {
  const response = await fetch(`${API_BASE_URL}/api/v1/assets/${encodeURIComponent(ticker)}`);
  return parseResponse<AssetInfo>(response);
}

export async function getTypedAsset(assetType: AssetType, assetId: string): Promise<AssetInfo> {
  const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetType}/${encodeURIComponent(assetId)}`);
  return parseResponse<AssetInfo>(response);
}

export async function searchAssets(assetType: AssetType, query: string): Promise<AssetSearchResult[]> {
  const params = new URLSearchParams({ assetType, q: query });
  const response = await fetch(`${API_BASE_URL}/api/v1/assets/search?${params.toString()}`);
  return parseResponse<AssetSearchResult[]>(response);
}

export async function runBacktest(input: BacktestRequest): Promise<BacktestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/backtests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<BacktestResponse>(response);
}

export async function listWatchlist(): Promise<WatchlistItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/watchlist`);
  return parseResponse<WatchlistItem[]>(response);
}

export async function createWatchlistItem(input: WatchlistItemCreate): Promise<WatchlistItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/watchlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parseResponse<WatchlistItem>(response);
}

export async function deleteWatchlistItem(id: string): Promise<{ deleted: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/watchlist/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return parseResponse<{ deleted: boolean }>(response);
}

export async function evaluateWatchlist(): Promise<WatchlistEvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/watchlist/evaluate`, {
    method: "POST",
  });
  return parseResponse<WatchlistEvaluationResponse>(response);
}

export async function getPortfolioRecommendations(
  input: PortfolioRecommendationRequest,
): Promise<PortfolioRecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/portfolio/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parseResponse<PortfolioRecommendationResponse>(response);
}
