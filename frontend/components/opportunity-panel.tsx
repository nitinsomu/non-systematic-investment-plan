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
  const scoreTone = opportunity.score >= 70 ? "text-emerald-700" : opportunity.score >= 45 ? "text-amber-700" : "text-red-700";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Opportunity Score</h2>
          <p className="mt-1 text-xs text-slate-500">{opportunity.summary}</p>
        </div>
        <button
          type="button"
          onClick={onAddToWatchlist}
          disabled={isSaving}
          className="h-8 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSaving ? "Saving" : "Add to Watchlist"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[180px_1fr_1fr]">
        <div className="rounded-md border border-slate-200 p-3">
          <div className={`text-3xl font-semibold ${scoreTone}`}>{opportunity.score}</div>
          <div className="text-xs font-medium text-slate-600">{opportunity.label}</div>
          <div className="mt-2 text-xs text-slate-500">As of {formatDate(opportunity.asOfDate)}</div>
        </div>
        <div className="rounded-md border border-slate-200 p-3 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Why Now</div>
          <ul className="space-y-1 text-slate-700">
            {opportunity.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-slate-200 p-3 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</div>
          <div className="font-semibold text-slate-950">{actionLabel(opportunity.suggestedAction)}</div>
          <div className="mt-1 text-slate-600">{formatMoney(opportunity.suggestedAmount, result.asset.currency)}</div>
          <div className="mt-2 text-xs text-slate-500">{opportunity.risks.join(" · ")}</div>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p> : null}
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
