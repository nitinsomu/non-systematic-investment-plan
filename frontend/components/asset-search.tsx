"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import type { BacktestFormValues } from "@/lib/schemas";
import type { AssetInfo, AssetSearchResult, AssetType } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";

type AssetSearchProps = {
  register: UseFormRegister<BacktestFormValues>;
  assetType: AssetType;
  error?: string;
  asset: AssetInfo | null;
  results: AssetSearchResult[];
  isLoadingAsset: boolean;
  onAssetTypeChange: (assetType: AssetType) => void;
  onLookup: () => void;
  onSelectResult: (asset: AssetSearchResult) => void;
};

export function AssetSearch({
  register,
  assetType,
  error,
  asset,
  results,
  isLoadingAsset,
  onAssetTypeChange,
  onLookup,
  onSelectResult,
}: AssetSearchProps) {
  const stockResults: AssetSearchResult[] = [
    { assetType: "STOCK", assetId: "RELIANCE.NS", ticker: "RELIANCE.NS", name: "Reliance Industries", currency: "INR" },
    { assetType: "STOCK", assetId: "TCS.NS", ticker: "TCS.NS", name: "Tata Consultancy Services", currency: "INR" },
    { assetType: "STOCK", assetId: "INFY.NS", ticker: "INFY.NS", name: "Infosys", currency: "INR" },
    { assetType: "STOCK", assetId: "HDFCBANK.NS", ticker: "HDFCBANK.NS", name: "HDFC Bank", currency: "INR" },
    { assetType: "STOCK", assetId: "AAPL", ticker: "AAPL", name: "Apple", currency: "USD" },
  ];
  const etfResults: AssetSearchResult[] = [
    { assetType: "ETF", assetId: "NIFTYBEES.NS", ticker: "NIFTYBEES.NS", name: "Nippon India ETF Nifty BeES", currency: "INR" },
    { assetType: "ETF", assetId: "GOLDBEES.NS", ticker: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", currency: "INR" },
    { assetType: "ETF", assetId: "JUNIORBEES.NS", ticker: "JUNIORBEES.NS", name: "Nippon India ETF Junior BeES", currency: "INR" },
  ];
  const goldResults: AssetSearchResult[] = [
    { assetType: "GOLD", assetId: "GOLDBEES.NS", ticker: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", currency: "INR" },
  ];
  const cryptoResults: AssetSearchResult[] = [
    { assetType: "CRYPTO", assetId: "bitcoin", ticker: "BTC", name: "Bitcoin", currency: "INR" },
    { assetType: "CRYPTO", assetId: "ethereum", ticker: "ETH", name: "Ethereum", currency: "INR" },
    { assetType: "CRYPTO", assetId: "solana", ticker: "SOL", name: "Solana", currency: "INR" },
  ];
  const staticResultsByType: Partial<Record<AssetType, AssetSearchResult[]>> = {
    STOCK: stockResults,
    ETF: etfResults,
    GOLD: goldResults,
    CRYPTO: cryptoResults,
  };
  const dropdownResults = staticResultsByType[assetType] ?? results;
  const inputPlaceholder: Record<AssetType, string> = {
    STOCK: "Search ticker or pick below",
    MUTUAL_FUND: "Search scheme name",
    ETF: "Pick ETF",
    GOLD: "Pick gold ETF",
    CRYPTO: "Pick BTC, ETH, or SOL",
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Asset</h2>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-5 rounded-md bg-slate-100 p-1 text-[11px] font-medium">
        {assetTabs.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => onAssetTypeChange(tab.type)}
            className={`h-7 rounded ${assetType === tab.type ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            {...register("ticker")}
            className="h-9 w-full min-w-0 rounded-md border border-slate-300 px-3 pr-8 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            placeholder={inputPlaceholder[assetType]}
            list={assetType === "STOCK" ? "stock-options" : undefined}
          />
          <ChevronsUpDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
          {assetType === "STOCK" ? (
            <datalist id="stock-options">
              {stockResults.map((result) => (
                <option key={result.assetId} value={result.ticker}>
                  {result.name}
                </option>
              ))}
            </datalist>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onLookup}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoadingAsset}
        >
          <Search className="h-4 w-4" />
          {isLoadingAsset ? "Searching" : assetType === "MUTUAL_FUND" ? "Search" : "Check"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
      {dropdownResults.length > 0 ? (
        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-slate-200">
          {dropdownResults.map((result) => {
            const isSelected = asset?.assetId === result.assetId && asset?.assetType === result.assetType;
            return (
            <button
              key={result.assetId}
              type="button"
              onClick={() => onSelectResult(result)}
              className="flex w-full items-start gap-2 border-b border-slate-100 px-2.5 py-2 text-left text-xs transition last:border-b-0 hover:bg-slate-50"
            >
              <Check className={`mt-0.5 h-3.5 w-3.5 flex-none ${isSelected ? "text-emerald-700" : "text-transparent"}`} />
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-950">{result.name}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-slate-500">
                  <span>{assetType === "MUTUAL_FUND" ? `Code ${result.assetId}` : result.ticker}</span>
                  <span>{result.currency}</span>
                  {result.latestPrice ? <span>{formatMoney(result.latestPrice, result.currency)}</span> : null}
                  {result.latestPriceDate ? <span>{formatDate(result.latestPriceDate)}</span> : null}
                </div>
              </div>
            </button>
          )})}
        </div>
      ) : null}
      {asset ? (
        <div className="mt-2 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600">
          <div className="truncate font-medium text-slate-950">{asset.name}</div>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>{asset.assetType === "MUTUAL_FUND" ? `Scheme ${asset.assetId}` : asset.ticker}</span>
            <span>{asset.currency}</span>
            {asset.exchange ? <span>{asset.exchange}</span> : null}
            {asset.latestPrice ? <span>{formatMoney(asset.latestPrice, asset.currency)}</span> : null}
            {asset.latestPriceDate ? <span>{formatDate(asset.latestPriceDate)}</span> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const assetTabs: Array<{ type: AssetType; label: string }> = [
  { type: "STOCK", label: "Stocks" },
  { type: "MUTUAL_FUND", label: "Funds" },
  { type: "ETF", label: "ETFs" },
  { type: "GOLD", label: "Gold" },
  { type: "CRYPTO", label: "Crypto" },
];
