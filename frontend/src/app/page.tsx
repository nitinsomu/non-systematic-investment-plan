"use client";

import { useState } from "react";
import StockSearch from "@/components/StockSearch";
import StrategyForm, { FormState } from "@/components/StrategyForm";
import ResultsView from "@/components/ResultsView";
import { searchStock, runBacktest, StockInfo, BacktestResponse } from "@/lib/api";

export default function Home() {
  const [stock, setStock] = useState<StockInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [backtesting, setBacktesting] = useState(false);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  async function handleSearch(ticker: string) {
    setSearching(true);
    setSearchError(null);
    setStock(null);
    setResult(null);
    try {
      const info = await searchStock(ticker);
      setStock(info);
    } catch {
      setSearchError("Ticker not found. Try AAPL, RELIANCE.NS, INFY.NS");
    } finally {
      setSearching(false);
    }
  }

  async function handleBacktest(params: FormState) {
    if (!stock) return;
    setBacktesting(true);
    setBacktestError(null);
    try {
      const res = await runBacktest({
        ticker: stock.ticker,
        start_date: params.startDate,
        end_date: params.endDate,
        monthly_amount: params.monthlyAmount,
        dip_pct: params.dipPct,
        deploy_multiplier: params.deployMultiplier,
      });
      setResult(res);
    } catch (e: unknown) {
      setBacktestError(e instanceof Error ? e.message : "Backtest failed");
    } finally {
      setBacktesting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c14]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0b1120] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <div>
            <h1 className="text-base font-bold tracking-widest text-slate-100 uppercase">NSIP</h1>
            <p className="text-xs text-slate-500 tracking-wide">Non-Systematic Investment Plan</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <StockSearch
          onSearch={handleSearch}
          loading={searching}
          error={searchError}
          stock={stock}
        />
        {stock && (
          <StrategyForm
            onSubmit={handleBacktest}
            loading={backtesting}
            error={backtestError}
          />
        )}
        {result && <ResultsView result={result} currency={stock?.currency ?? ""} />}
      </div>
    </main>
  );
}
