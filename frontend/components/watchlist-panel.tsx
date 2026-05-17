"use client";

import { RefreshCw, Trash2 } from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import type { WatchlistEvaluationItem, WatchlistItem } from "@/lib/types";

type WatchlistPanelProps = {
  items: WatchlistItem[];
  evaluations: WatchlistEvaluationItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
};

export function WatchlistPanel({ items, evaluations, isLoading, onRefresh, onDelete }: WatchlistPanelProps) {
  const evaluationMap = new Map(evaluations.map((item) => [item.watchlistItem.id, item]));

  return (
    <section className="nsip-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Watchlist Dry Run</h2>
          <p className="text-xs text-slate-500">Refresh signals on demand for saved assets.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="nsip-button inline-flex h-8 items-center gap-2 px-3 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {isLoading ? "Refreshing" : "Refresh Signals"}
        </button>
      </div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">No watchlist items yet. Run a backtest and add the setup.</div>
      ) : (
        <div className="grid gap-2 p-3 xl:grid-cols-2">
          {items.map((item) => {
            const evaluation = evaluationMap.get(item.id);
            return (
              <div key={item.id} className="nsip-panel p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">{item.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{item.assetType === "MUTUAL_FUND" ? `Scheme ${item.assetId}` : item.ticker}</span>
                      <span>{formatMoney(item.monthlyAmount, item.currency)}/mo</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="rounded p-1 text-slate-500 hover:bg-red-950/30 hover:text-red-400"
                    aria-label="Delete watchlist item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {evaluation ? (
                  <div className="mt-3 grid grid-cols-[72px_1fr] gap-3 text-sm">
                    <div>
                      <div className="text-2xl font-semibold text-emerald-400">{evaluation.opportunity.score}</div>
                      <div className="text-xs text-slate-500">{evaluation.opportunity.label}</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">
                        {evaluation.alert.alertLevel} · {evaluation.opportunity.suggestedAction}
                      </div>
                      <div className="text-xs text-slate-400">{evaluation.opportunity.summary}</div>
                      <div className="mt-1 text-xs text-slate-500">{evaluation.alert.alertReason}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Evaluated {formatDate(evaluation.lastEvaluatedAt)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500">Not evaluated yet.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
