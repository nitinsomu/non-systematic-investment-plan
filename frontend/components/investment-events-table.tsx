import type { BacktestResponse } from "@/lib/types";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

type InvestmentEventsTableProps = {
  result: BacktestResponse;
};

export function InvestmentEventsTable({ result }: InvestmentEventsTableProps) {
  return (
    <section className="nsip-card">
      <div className="border-b border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Investment Events</h2>
        <p className="text-xs text-slate-500">Monthly actions produced by each strategy.</p>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-[#080c14] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Strategy</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Invested</th>
              <th className="px-4 py-3 font-semibold">Units</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {result.events.map((event, index) => (
              <tr key={`${event.date}-${event.strategy}-${index}`} className="text-slate-300">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(event.date)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={strategyClassName(event.strategy)}>
                    {strategyLabel(event.strategy)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatMoney(event.price, result.asset.currency)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-100">
                  {formatMoney(event.amountInvested, result.asset.currency)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatNumber(event.unitsBought, 4)}</td>
                <td className="px-4 py-3">
                  <div>{event.reason}</div>
                  {event.strategy === "RESERVE_BUY_THE_DIP" ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Reserve deployed: {formatMoney(event.reserveDeployed ?? 0, result.asset.currency)} · Balance:{" "}
                      {formatMoney(event.cashReserveBalance ?? 0, result.asset.currency)}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function strategyLabel(strategy: BacktestResponse["events"][number]["strategy"]): string {
  if (strategy === "BUY_THE_DIP") {
    return "Buy the Dip";
  }
  if (strategy === "RESERVE_BUY_THE_DIP") {
    return "Reserve-Aware";
  }
  if (strategy === "RSI_DIP") {
    return "RSI Dip";
  }
  if (strategy === "MOMENTUM_BOOST") {
    return "Momentum Boost";
  }
  return "Regular SIP";
}

function strategyClassName(strategy: BacktestResponse["events"][number]["strategy"]): string {
  if (strategy === "BUY_THE_DIP") {
    return "text-emerald-400";
  }
  if (strategy === "RESERVE_BUY_THE_DIP") {
    return "text-violet-400";
  }
  if (strategy === "RSI_DIP") {
    return "text-blue-400";
  }
  if (strategy === "MOMENTUM_BOOST") {
    return "text-rose-400";
  }
  return "text-slate-300";
}
