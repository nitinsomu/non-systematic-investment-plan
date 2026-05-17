import type { BacktestResponse, StrategyMetrics } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

type ResultsSummaryProps = {
  result: BacktestResponse;
};

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const currency = result.asset.currency;
  const regular = result.metrics.regularSip;
  const dip = result.metrics.buyTheDip;
  const reserve = result.metrics.reserveAwareBuyTheDip;
  const dipEvents = result.strategies.find((strategy) => strategy.id === "BUY_THE_DIP")?.events ?? [];
  const monthlyBase = regular.totalInvested / Math.max(regular.numberOfInvestments, 1);
  const dipTriggers = dipEvents.filter((event) => event.amountInvested > monthlyBase).length;
  const rows = [
    ["Total Invested", formatMoney(regular.totalInvested, currency), formatMoney(dip.totalInvested, currency)],
    ["Current Value", formatMoney(regular.currentValue, currency), formatMoney(dip.currentValue, currency)],
    ["Gain / Loss", formatMoney(regular.absoluteGain, currency), formatMoney(dip.absoluteGain, currency)],
    ["Return", formatPercent(regular.returnPercent), formatPercent(dip.returnPercent)],
    ["XIRR", formatPercent(regular.xirr), formatPercent(dip.xirr)],
    ["Months Invested", String(regular.numberOfInvestments), String(dip.numberOfInvestments)],
    ["Dip Months", "—", String(dipTriggers)],
  ];

  return (
    <section className="nsip-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">SIP vs Buy the Dip</h2>
          <p className="text-xs text-slate-500">
            {result.asset.name} from {result.dateRange.startDate} to {result.dateRange.endDate}
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-[#080c14]">
              <th className="px-4 py-3 text-left nsip-label">Metric</th>
              <th className="px-4 py-3 text-right nsip-label">Regular SIP</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-blue-400">
                Buy the Dip
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, sipValue, dipValue]) => (
              <tr key={label} className="border-b border-slate-800/70 last:border-b-0 hover:bg-slate-800/20">
                <td className="px-4 py-3 text-xs text-slate-400">{label}</td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-slate-200">{sipValue}</td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-blue-300">{dipValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <MetricPanel title="Reserve-Aware" metrics={reserve} currency={currency} />
        {result.strategies
          .filter((strategy) => strategy.id === "RSI_DIP" || strategy.id === "MOMENTUM_BOOST")
          .map((strategy) => (
            <MetricPanel key={strategy.id} title={strategy.label} metrics={strategy.metrics} currency={currency} />
          ))}
      </div>
    </section>
  );
}

function MetricPanel({ title, metrics, currency }: { title: string; metrics: StrategyMetrics; currency: string }) {
  const gainTone = metrics.absoluteGain >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="nsip-panel p-2.5">
      <h3 className="mb-2 text-sm font-semibold text-slate-100">{title}</h3>
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

function Metric({ label, value, valueClassName = "text-slate-100" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</dd>
    </div>
  );
}
