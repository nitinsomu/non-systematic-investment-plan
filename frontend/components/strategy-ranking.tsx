import type { BacktestResponse } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

type StrategyRankingProps = {
  result: BacktestResponse;
};

export function StrategyRanking({ result }: StrategyRankingProps) {
  const rankedStrategies = [...result.strategies].sort(
    (left, right) => right.metrics.currentValue - left.metrics.currentValue,
  );
  const currency = result.asset.currency;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-950">Strategy Ranking</h2>
        <p className="text-xs text-slate-500">Sorted by current value after the selected backtest period.</p>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Strategy</th>
              <th className="px-4 py-3 font-semibold">Current value</th>
              <th className="px-4 py-3 font-semibold">XIRR</th>
              <th className="px-4 py-3 font-semibold">Return</th>
              <th className="px-4 py-3 font-semibold">Invested</th>
              <th className="px-4 py-3 font-semibold">Reserve</th>
              <th className="px-4 py-3 font-semibold">Investments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankedStrategies.map((strategy, index) => (
              <tr key={strategy.id} className="text-slate-700">
                <td className="px-4 py-3 font-semibold text-slate-950">#{index + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-950">{strategy.label}</td>
                <td className="px-4 py-3">{formatMoney(strategy.metrics.currentValue, currency)}</td>
                <td className="px-4 py-3">{formatPercent(strategy.metrics.xirr)}</td>
                <td className={strategy.metrics.returnPercent >= 0 ? "px-4 py-3 text-emerald-700" : "px-4 py-3 text-red-700"}>
                  {formatPercent(strategy.metrics.returnPercent)}
                </td>
                <td className="px-4 py-3">{formatMoney(strategy.metrics.totalInvested, currency)}</td>
                <td className="px-4 py-3">
                  {strategy.metrics.endingCashReserve === null || strategy.metrics.endingCashReserve === undefined
                    ? "N/A"
                    : formatMoney(strategy.metrics.endingCashReserve, currency)}
                </td>
                <td className="px-4 py-3">{strategy.metrics.numberOfInvestments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
