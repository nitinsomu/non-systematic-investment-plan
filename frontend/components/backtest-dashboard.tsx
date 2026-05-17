"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { AssetSearch } from "@/components/asset-search";
import { BacktestVerdict } from "@/components/backtest-verdict";
import { OpportunityPanel } from "@/components/opportunity-panel";
import { PortfolioChart } from "@/components/portfolio-chart";
import { ResultsSummary } from "@/components/results-summary";
import { StrategyForm } from "@/components/strategy-form";
import { StrategyRanking } from "@/components/strategy-ranking";
import { createWatchlistItem, getAsset, getTypedAsset, listWatchlist, runBacktest, searchAssets } from "@/lib/api";
import { backtestFormSchema, type BacktestFormValues } from "@/lib/schemas";
import type { AssetInfo, AssetSearchResult, AssetType, BacktestRequest, BacktestResponse, WatchlistItem } from "@/lib/types";

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
  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);

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


  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <header className="border-b border-slate-800 bg-[#0b1120]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <div>
              <h1 className="text-base font-bold uppercase tracking-widest text-slate-100">NSIP</h1>
              <p className="text-xs tracking-wide text-slate-500">Non-Systematic Investment Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-500">
            <Activity className="h-4 w-4 text-emerald-400" />
            V1-V9 Hybrid
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="mt-4 space-y-4">
          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <div className="font-semibold">Backtest failed</div>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="nsip-card p-8 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-emerald-400" />
              <p className="text-sm font-medium text-slate-100">Running historical backtest</p>
              <p className="mt-1 text-xs text-slate-500">Fetching price data and calculating enabled strategies.</p>
            </div>
          ) : null}

          {!isLoading && !result ? (
            <section className="nsip-card p-6 text-center">
              <h2 className="text-base font-semibold text-slate-100">Run your first NSIP backtest</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                Select an asset, keep the default India-first settings, and compare systematic investing strategies.
              </p>
            </section>
          ) : null}

          {result ? (
            <>
              <BacktestVerdict result={result} />
              <ResultsSummary result={result} />
              <PortfolioChart result={result} />
              <div className="space-y-4 pt-2">
                <OpportunityPanel
                  result={result}
                  onAddToWatchlist={handleAddToWatchlist}
                  isSaving={isSavingWatchlist}
                  message={watchlistMessage}
                />
                <StrategyRanking result={result} />
              </div>
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
