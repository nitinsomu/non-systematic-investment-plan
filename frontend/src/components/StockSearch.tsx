"use client";

import { useState } from "react";
import { StockInfo } from "@/lib/api";

interface Props {
  onSearch: (ticker: string) => void;
  loading: boolean;
  error: string | null;
  stock: StockInfo | null;
}

export default function StockSearch({ onSearch, loading, error, stock }: Props) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim().toUpperCase());
  }

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-5">
      <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">
        Stock
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="AAPL · RELIANCE.NS · INFY.NS"
          className="flex-1 bg-[#080c14] border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wide"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md disabled:opacity-40 transition-colors tracking-widest uppercase"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>
      )}

      {stock && (
        <div className="mt-3 flex items-center gap-4 p-3 bg-[#080c14] border border-slate-800 rounded-md">
          <span className="font-mono font-bold text-emerald-400 tracking-wider text-sm">
            {stock.ticker}
          </span>
          <span className="text-slate-400 text-xs">{stock.name}</span>
          {stock.current_price != null && (
            <span className="ml-auto font-mono text-slate-200 font-semibold text-sm num">
              {stock.currency} {stock.current_price.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
