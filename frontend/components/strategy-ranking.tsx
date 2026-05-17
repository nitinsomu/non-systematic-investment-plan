import type { BacktestResponse } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

type StrategyRankingProps = {
  result: BacktestResponse;
};

export function StrategyRanking({ result }: StrategyRankingProps) {
  const rankedStrategies = [...result.strategies].sort(
    (left, right) => (right.metrics.xirr ?? 0) - (left.metrics.xirr ?? 0),
  );
  const currency = result.asset.currency;

  return (
    <section className="nsip-card">
      <div className="border-b border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Strategy Ranking</h2>
        <p className="text-xs text-slate-500">Sorted by XIRR — accounts for total capital deployed and timing of investments.</p>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[#080c14] text-xs uppercase tracking-wide text-slate-500">
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
          <tbody className="divide-y divide-slate-800">
            {rankedStrategies.map((strategy, index) => (
              <tr key={strategy.id} className="text-slate-300">
                <td className="px-4 py-3 font-semibold text-slate-100">#{index + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-100">{strategy.label}</td>
                <td className="px-4 py-3">{formatMoney(strategy.metrics.currentValue, currency)}</td>
                <td className="px-4 py-3">{formatPercent(strategy.metrics.xirr)}</td>
                <td className={strategy.metrics.returnPercent >= 0 ? "px-4 py-3 text-emerald-400" : "px-4 py-3 text-red-400"}>
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
