import type { BacktestResponse } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

type BacktestVerdictProps = {
  result: BacktestResponse;
};

export function BacktestVerdict({ result }: BacktestVerdictProps) {
  const currency = result.asset.currency;
  const sip = result.metrics.regularSip;
  const dip = result.metrics.buyTheDip;
  const valueDelta = dip.currentValue - sip.currentValue;
  const dipHigherValue = valueDelta > 0;
  const dipHigherXirr = (dip.xirr ?? 0) > (sip.xirr ?? 0);
  const dipWinsOnBoth = dipHigherValue && dipHigherXirr;
  const sipWinsOnBoth = !dipHigherValue && !dipHigherXirr;
  const dipEvents = result.strategies.find((strategy) => strategy.id === "BUY_THE_DIP")?.events ?? [];
  const dipTriggers = dipEvents.filter((event) => event.amountInvested > result.metrics.regularSip.totalInvested / Math.max(result.metrics.regularSip.numberOfInvestments, 1)).length;

  let accent = "border-blue-700/50 bg-blue-950/30 text-blue-300";
  let text = `Buy the Dip created ${formatMoney(Math.abs(valueDelta), currency)} ${dipHigherValue ? "more" : "less"} final value, with XIRR ${formatPercent(dip.xirr)} vs Regular SIP ${formatPercent(sip.xirr)}.`;

  if (dipWinsOnBoth) {
    accent = "border-emerald-700/50 bg-emerald-950/30 text-emerald-400";
    text = `Buy the Dip outperformed on both final value (+${formatMoney(valueDelta, currency)}) and XIRR (${formatPercent(dip.xirr)} vs ${formatPercent(sip.xirr)}).`;
  } else if (sipWinsOnBoth) {
    accent = "border-slate-700 bg-slate-800/30 text-slate-300";
    text = "Regular SIP outperformed on both final value and XIRR for this period.";
  } else if (dipHigherValue) {
    text = `Buy the Dip earned more in absolute terms (+${formatMoney(valueDelta, currency)}), but Regular SIP had better capital efficiency by XIRR (${formatPercent(sip.xirr)} vs ${formatPercent(dip.xirr)}).`;
  }

  return (
    <section className={`rounded-lg border px-4 py-3 text-xs font-medium leading-relaxed ${accent}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest opacity-75">Verdict</div>
      <p>{text}</p>
      <p className="mt-2 text-[11px] opacity-75">
        Dip months with extra deployment: {dipTriggers}. Use this as a backtest explanation, not a guarantee.
      </p>
    </section>
  );
}
