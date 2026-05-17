"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/format";
import type { PortfolioRecommendationResponse } from "@/lib/types";

type PortfolioRecommendationsProps = {
  result: PortfolioRecommendationResponse | null;
  isLoading: boolean;
  onRun: (monthlyBudget: number) => void;
};

export function PortfolioRecommendations({ result, isLoading, onRun }: PortfolioRecommendationsProps) {
  const [monthlyBudget, setMonthlyBudget] = useState(50000);

  return (
    <section className="nsip-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Portfolio Recommendations</h2>
          <p className="text-xs text-slate-500">Allocate a monthly budget across actionable watchlist signals.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={monthlyBudget}
            onChange={(event) => setMonthlyBudget(Number(event.target.value))}
            className="nsip-input h-8 w-32"
          />
          <button
            type="button"
            onClick={() => onRun(monthlyBudget)}
            disabled={isLoading}
            className="nsip-button h-8 px-3 text-xs font-semibold"
          >
            {isLoading ? "Allocating" : "Recommend"}
          </button>
        </div>
      </div>
      {result ? (
        <div className="p-3">
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <Metric label="Budget" value={formatMoney(result.monthlyBudget, "INR")} />
            <Metric label="Allocated" value={formatMoney(result.allocatedAmount, "INR")} />
            <Metric label="Keep Cash" value={formatMoney(result.keepCashAmount, "INR")} />
          </div>
          {result.recommendations.length === 0 ? (
            <div className="text-sm text-slate-500">No watchlist assets cleared the allocation threshold.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#080c14] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Asset</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Allocation</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {result.recommendations.map((recommendation) => (
                    <tr key={recommendation.watchlistItem.id}>
                      <td className="px-3 py-2 font-medium text-slate-100">{recommendation.watchlistItem.name}</td>
                      <td className="px-3 py-2">{recommendation.opportunity.score}</td>
                      <td className="px-3 py-2">{recommendation.opportunity.suggestedAction}</td>
                      <td className="px-3 py-2">{formatMoney(recommendation.recommendedAmount, recommendation.watchlistItem.currency)}</td>
                      <td className="px-3 py-2">{recommendation.allocationPercent}%</td>
                      <td className="px-3 py-2 text-slate-400">{recommendation.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 text-sm text-slate-500">Refresh watchlist signals, then generate recommendations.</div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="nsip-panel p-2.5">
      <div className="text-sm font-semibold text-slate-100">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
