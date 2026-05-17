import { formatDate, formatMoney } from "@/lib/format";
import type { BacktestResponse } from "@/lib/types";

type OpportunityPanelProps = {
  result: BacktestResponse;
  onAddToWatchlist: () => void;
  isSaving: boolean;
  message: string | null;
};

export function OpportunityPanel({ result, onAddToWatchlist, isSaving, message }: OpportunityPanelProps) {
  const opportunity = result.opportunity;
  const scoreTone = opportunity.score >= 70 ? "text-emerald-400" : opportunity.score >= 45 ? "text-amber-400" : "text-red-400";

  return (
    <section className="nsip-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Opportunity Score</h2>
          <p className="mt-1 text-xs text-slate-500">{opportunity.summary}</p>
        </div>
        <button
          type="button"
          onClick={onAddToWatchlist}
          disabled={isSaving}
          className="nsip-button h-8 px-3 text-xs font-semibold"
        >
          {isSaving ? "Saving" : "Add to Watchlist"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[180px_1fr_1fr]">
        <div className="nsip-panel p-3">
          <div className={`text-3xl font-semibold ${scoreTone}`}>{opportunity.score}</div>
          <div className="text-xs font-medium text-slate-500">{opportunity.label}</div>
          <div className="mt-2 text-xs text-slate-500">As of {formatDate(opportunity.asOfDate)}</div>
        </div>
        <div className="nsip-panel p-3 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Why Now</div>
          <ul className="space-y-1 text-slate-300">
            {opportunity.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
        <div className="nsip-panel p-3 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</div>
          <div className="font-semibold text-slate-100">{actionLabel(opportunity.suggestedAction)}</div>
          <div className="mt-1 text-slate-400">{formatMoney(opportunity.suggestedAmount, result.asset.currency)}</div>
          <div className="mt-2 text-xs text-slate-500">{opportunity.risks.join(" · ")}</div>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs font-medium text-emerald-400">{message}</p> : null}
    </section>
  );
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    AVOID_CHASING: "Avoid Chasing",
    WATCH: "Watch",
    ACCUMULATE: "Accumulate",
    DEPLOY_RESERVE: "Deploy Reserve",
  };
  return labels[action] ?? action;
}
