import type { BacktestResponse, StrategyMetrics } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

type ResultsSummaryProps = {
  result: BacktestResponse;
};

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const currency = result.asset.currency;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Backtest Results</h2>
          <p className="text-xs text-slate-500">
            {result.asset.name} from {result.dateRange.startDate} to {result.dateRange.endDate}
          </p>
        </div>
      </div>
      <div className="grid gap-2 xl:grid-cols-3">
        <MetricPanel title="Regular SIP" metrics={result.metrics.regularSip} currency={currency} />
        <MetricPanel title="Buy the Dip" metrics={result.metrics.buyTheDip} currency={currency} />
        <MetricPanel title="Reserve-Aware Buy the Dip" metrics={result.metrics.reserveAwareBuyTheDip} currency={currency} />
      </div>
    </section>
  );
}

function MetricPanel({ title, metrics, currency }: { title: string; metrics: StrategyMetrics; currency: string }) {
  const gainTone = metrics.absoluteGain >= 0 ? "text-emerald-700" : "text-red-700";

  return (
    <div className="rounded-md border border-slate-200 p-2.5">
      <h3 className="mb-2 text-sm font-semibold text-slate-950">{title}</h3>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="Invested" value={formatMoney(metrics.totalInvested, currency)} />
        <Metric label="Current value" value={formatMoney(metrics.currentValue, currency)} />
        <Metric label="Gain" value={formatMoney(metrics.absoluteGain, currency)} valueClassName={gainTone} />
        <Metric label="Return" value={formatPercent(metrics.returnPercent)} valueClassName={gainTone} />
        <Metric label="XIRR" value={formatPercent(metrics.xirr)} />
        <Metric label="Investments" value={String(metrics.numberOfInvestments)} />
        {metrics.endingCashReserve !== null && metrics.endingCashReserve !== undefined ? (
          <Metric label="Ending reserve" value={formatMoney(metrics.endingCashReserve, currency)} />
        ) : null}
        {metrics.reserveDeployed !== null && metrics.reserveDeployed !== undefined ? (
          <Metric label="Reserve deployed" value={formatMoney(metrics.reserveDeployed, currency)} />
        ) : null}
      </dl>
    </div>
  );
}

function Metric({ label, value, valueClassName = "text-slate-950" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</dd>
    </div>
  );
}
