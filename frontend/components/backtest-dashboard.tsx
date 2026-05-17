"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, BarChart3 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { AssetSearch } from "@/components/asset-search";
import { AlertDashboard } from "@/components/alert-dashboard";
import { InvestmentEventsTable } from "@/components/investment-events-table";
import { OpportunityPanel } from "@/components/opportunity-panel";
import { PortfolioRecommendations } from "@/components/portfolio-recommendations";
import { PortfolioChart } from "@/components/portfolio-chart";
import { ResultsSummary } from "@/components/results-summary";
import { StrategyForm } from "@/components/strategy-form";
import { StrategyRanking } from "@/components/strategy-ranking";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { createWatchlistItem, deleteWatchlistItem, evaluateWatchlist, getAsset, getPortfolioRecommendations, getTypedAsset, listWatchlist, runBacktest, searchAssets } from "@/lib/api";
import { backtestFormSchema, type BacktestFormValues } from "@/lib/schemas";
import type { AssetInfo, AssetSearchResult, AssetType, BacktestRequest, BacktestResponse, PortfolioRecommendationResponse, WatchlistEvaluationItem, WatchlistEvaluationResponse, WatchlistItem } from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);

const defaultValues: BacktestFormValues = {
  ticker: "RELIANCE.NS",
  assetType: "STOCK",
  assetId: "RELIANCE.NS",
  monthlyAmount: 5000,
  currency: "INR",
  startDate: "2020-01-01",
  endDate: today,
  dipThresholdPercent: 5,
  movingAverageDays: 200,
  deployMultiplier: 2,
  reserveEnabled: true,
  baseSipPercent: 50,
  rsiDipEnabled: true,
  momentumBoostEnabled: true,
  rsiPeriod: 14,
  rsiThreshold: 30,
  momentumAverageDays: 50,
};

export function BacktestDashboard() {
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [asset, setAsset] = useState<AssetInfo | null>(null);
  const [assetResults, setAssetResults] = useState<AssetSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [watchlistEvaluations, setWatchlistEvaluations] = useState<WatchlistEvaluationItem[]>([]);
  const [watchlistEvaluationResponse, setWatchlistEvaluationResponse] = useState<WatchlistEvaluationResponse | null>(null);
  const [portfolioRecommendations, setPortfolioRecommendations] = useState<PortfolioRecommendationResponse | null>(null);
  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);
  const [isRefreshingWatchlist, setIsRefreshingWatchlist] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { errors },
  } = useForm<BacktestFormValues>({
    resolver: zodResolver(backtestFormSchema),
    defaultValues,
  });
  const assetType = useWatch({ control, name: "assetType" });
  const reserveEnabled = useWatch({ control, name: "reserveEnabled" });
  const baseSipPercent = useWatch({ control, name: "baseSipPercent" });

  useEffect(() => {
    refreshWatchlistItems().catch(() => {
      setWatchlistItems([]);
    });
  }, []);

  async function refreshWatchlistItems() {
    const items = await listWatchlist();
    setWatchlistItems(items);
  }

  function handleAssetTypeChange(nextAssetType: AssetType) {
    setValue("assetType", nextAssetType);
    setAsset(null);
    setAssetResults([]);
    setAssetError(null);

    if (nextAssetType === "STOCK") {
      setValue("ticker", "RELIANCE.NS");
      setValue("assetId", "RELIANCE.NS");
      setValue("currency", "INR");
      return;
    }
    if (nextAssetType === "ETF") {
      setValue("ticker", "NIFTYBEES.NS");
      setValue("assetId", "NIFTYBEES.NS");
      setValue("currency", "INR");
      return;
    }
    if (nextAssetType === "GOLD") {
      setValue("ticker", "GOLDBEES.NS");
      setValue("assetId", "GOLDBEES.NS");
      setValue("currency", "INR");
      return;
    }
    if (nextAssetType === "CRYPTO") {
      setValue("ticker", "bitcoin");
      setValue("assetId", "bitcoin");
      setValue("currency", "INR");
      return;
    }

    setValue("ticker", "");
    setValue("assetId", "");
    setValue("currency", "INR");
  }

  async function handleAssetLookup() {
    const rawQuery = getValues("ticker").trim();
    const ticker = assetType === "CRYPTO" ? rawQuery.toLowerCase() : rawQuery.toUpperCase();
    if (!ticker) {
      setAssetError("Ticker is required");
      return;
    }

    setIsLoadingAsset(true);
    setAssetError(null);
    try {
      if (assetType === "MUTUAL_FUND") {
        const results = await searchAssets("MUTUAL_FUND", ticker);
        setAssetResults(results);
        setAsset(null);
        if (results.length === 0) {
          setAssetError("No mutual funds matched that search");
        }
      } else if (assetType === "STOCK") {
        const assetInfo = await getAsset(ticker);
        setValue("assetId", assetInfo.assetId);
        setValue("currency", assetInfo.currency);
        setAsset(assetInfo);
        setAssetResults([]);
      } else {
        const assetInfo = await getTypedAsset(assetType, ticker);
        setValue("assetId", assetInfo.assetId);
        setValue("ticker", assetInfo.assetId);
        setValue("currency", assetInfo.currency);
        setAsset(assetInfo);
        setAssetResults([]);
      }
    } catch (lookupError) {
      setAsset(null);
      setAssetError(lookupError instanceof Error ? lookupError.message : "Could not load asset");
    } finally {
      setIsLoadingAsset(false);
    }
  }

  function handleSelectResult(selectedAsset: AssetSearchResult) {
    setValue("assetId", selectedAsset.assetId);
    setValue("ticker", selectedAsset.assetType === "MUTUAL_FUND" ? selectedAsset.name : selectedAsset.assetId);
    setValue("currency", selectedAsset.currency);
    setAsset({
      assetType: selectedAsset.assetType,
      assetId: selectedAsset.assetId,
      ticker: selectedAsset.ticker,
      name: selectedAsset.name,
      currency: selectedAsset.currency,
      latestPrice: selectedAsset.latestPrice,
      latestPriceDate: selectedAsset.latestPriceDate,
      exchange: "AMFI",
    });
    setAssetResults([]);
    setAssetError(null);
  }

  async function onSubmit(values: BacktestFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await runBacktest(buildBacktestRequest(values));
      setResult(response);
      setAsset({
        assetType: response.asset.assetType,
        assetId: response.asset.assetId,
        ticker: response.asset.ticker,
        name: response.asset.name,
        currency: response.asset.currency,
      });
    } catch (backtestError) {
      setResult(null);
      setError(backtestError instanceof Error ? backtestError.message : "Backtest failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddToWatchlist() {
    if (!result) return;
    const values = getValues();
    const request = buildBacktestRequest(values);
    setIsSavingWatchlist(true);
    setWatchlistMessage(null);
    try {
      await createWatchlistItem({
        assetType: request.assetType,
        assetId: request.assetId,
        ticker: result.asset.ticker,
        name: result.asset.name,
        currency: result.asset.currency,
        monthlyAmount: request.monthlyAmount,
        enabledStrategies: request.enabledStrategies,
        strategy: request.strategy,
      });
      await refreshWatchlistItems();
      setWatchlistMessage("Added to watchlist.");
    } catch (saveError) {
      setWatchlistMessage(saveError instanceof Error ? saveError.message : "Could not save watchlist item.");
    } finally {
      setIsSavingWatchlist(false);
    }
  }

  async function handleRefreshWatchlist() {
    setIsRefreshingWatchlist(true);
    try {
      await refreshWatchlistItems();
      const response = await evaluateWatchlist();
      setWatchlistEvaluations(response.items);
      setWatchlistEvaluationResponse(response);
    } finally {
      setIsRefreshingWatchlist(false);
    }
  }

  async function handlePortfolioRecommendations(monthlyBudget: number) {
    setIsLoadingRecommendations(true);
    try {
      const response = await getPortfolioRecommendations({
        monthlyBudget,
        maxPerAssetPercent: 35,
        minimumScore: 55,
      });
      setPortfolioRecommendations(response);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  async function handleDeleteWatchlist(id: string) {
    await deleteWatchlistItem(id);
    setWatchlistItems((items) => items.filter((item) => item.id !== id));
    setWatchlistEvaluations((items) => items.filter((item) => item.watchlistItem.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-950">NSIP</h1>
                <p className="text-xs text-slate-500">Backtest mode</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Activity className="h-4 w-4 text-emerald-700" />
            Strategy Battle Arena
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[340px_1fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <AssetSearch
            register={register}
            assetType={assetType}
            error={errors.ticker?.message ?? assetError ?? undefined}
            asset={asset}
            results={assetResults}
            isLoadingAsset={isLoadingAsset}
            onAssetTypeChange={handleAssetTypeChange}
            onLookup={handleAssetLookup}
            onSelectResult={handleSelectResult}
          />
          <StrategyForm
            register={register}
            errors={errors}
            isLoading={isLoading}
            reserveEnabled={reserveEnabled}
            baseSipPercent={baseSipPercent}
          />
        </form>

        <div className="space-y-4">
          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <div className="font-semibold">Backtest failed</div>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />
              <p className="text-sm font-medium text-slate-950">Running historical backtest</p>
              <p className="mt-1 text-xs text-slate-500">Fetching price data and calculating both strategies.</p>
            </div>
          ) : null}

          {!isLoading && !result ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Run your first NSIP backtest</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                Enter a stock ticker, keep the default India-first strategy, and compare regular SIP with buying extra
                when the stock trades below its moving average.
              </p>
            </section>
          ) : null}

          {result ? (
            <>
              <OpportunityPanel
                result={result}
                onAddToWatchlist={handleAddToWatchlist}
                isSaving={isSavingWatchlist}
                message={watchlistMessage}
              />
              <ResultsSummary result={result} />
              <PortfolioChart result={result} />
              <StrategyRanking result={result} />
              <AlertDashboard evaluation={watchlistEvaluationResponse} />
              <WatchlistPanel
                items={watchlistItems}
                evaluations={watchlistEvaluations}
                isLoading={isRefreshingWatchlist}
                onRefresh={handleRefreshWatchlist}
                onDelete={handleDeleteWatchlist}
              />
              <PortfolioRecommendations
                result={portfolioRecommendations}
                isLoading={isLoadingRecommendations}
                onRun={handlePortfolioRecommendations}
              />
              <InvestmentEventsTable result={result} />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function buildBacktestRequest(values: BacktestFormValues): BacktestRequest {
  return {
    enabledStrategies: [
      "REGULAR_SIP",
      "BUY_THE_DIP",
      "RESERVE_BUY_THE_DIP",
      ...(values.rsiDipEnabled ? (["RSI_DIP"] as const) : []),
      ...(values.momentumBoostEnabled ? (["MOMENTUM_BOOST"] as const) : []),
    ],
    assetType: values.assetType,
    assetId: values.assetType === "MUTUAL_FUND" ? values.assetId ?? "" : values.assetId || values.ticker,
    ticker: values.assetType === "MUTUAL_FUND" ? undefined : values.ticker,
    monthlyAmount: values.monthlyAmount,
    currency: values.currency,
    startDate: values.startDate,
    endDate: values.endDate,
    strategy: {
      type: "BUY_THE_DIP",
      dipThresholdPercent: values.dipThresholdPercent,
      movingAverageDays: values.movingAverageDays,
      deployMultiplier: values.deployMultiplier,
      reserve: {
        enabled: values.reserveEnabled,
        baseSipPercent: values.baseSipPercent,
      },
      rsi: {
        period: values.rsiPeriod,
        threshold: values.rsiThreshold,
      },
      momentum: {
        movingAverageDays: values.momentumAverageDays,
      },
    },
  };
}
