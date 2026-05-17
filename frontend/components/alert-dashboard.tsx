import type { WatchlistEvaluationResponse } from "@/lib/types";

type AlertDashboardProps = {
  evaluation: WatchlistEvaluationResponse | null;
};

export function AlertDashboard({ evaluation }: AlertDashboardProps) {
  if (!evaluation) {
    return null;
  }

  const summary = evaluation.summary;

  return (
    <section className="nsip-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Alert Dashboard</h2>
          <p className="text-xs text-slate-500">Generated from the latest manual watchlist refresh.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        <CountCard label="Watched" value={summary.total} tone="text-slate-100" />
        <CountCard label="Buy" value={summary.buy} tone="text-emerald-400" />
        <CountCard label="Avoid" value={summary.avoid} tone="text-red-400" />
        <CountCard label="Watch" value={summary.watch} tone="text-amber-400" />
        <CountCard label="None" value={summary.none} tone="text-slate-500" />
      </div>
    </section>
  );
}

function CountCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="nsip-panel p-2.5">
      <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
