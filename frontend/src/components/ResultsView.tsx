"use client";

import { BacktestResponse } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  result: BacktestResponse;
  currency: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function pct(n: number | null) {
  return n !== null ? `${n.toFixed(2)}%` : "—";
}

export default function ResultsView({ result, currency }: Props) {
  const { sip, dip } = result;

  const chartData = sip.portfolio_history.map((point, i) => ({
    date: point.date,
    "Regular SIP": point.value,
    "Buy the Dip": dip.portfolio_history[i]?.value ?? null,
    "SIP Invested": point.invested,
    "Dip Invested": dip.portfolio_history[i]?.invested ?? null,
  }));

  const sipGain = sip.final_value - sip.total_invested;
  const dipGain = dip.final_value - dip.total_invested;
  const dipHigherValue = dip.final_value > sip.final_value;
  const dipHigherXirr = (dip.xirr ?? 0) > (sip.xirr ?? 0);
  const dipWinsOnBoth = dipHigherValue && dipHigherXirr;
  const sipWinsOnBoth = !dipHigherValue && !dipHigherXirr;
  const cur = currency ? `${currency} ` : "";

  function verdict() {
    if (dipWinsOnBoth)
      return { text: `Buy the Dip outperforms on both absolute return (+${cur}${fmt(dip.final_value - sip.final_value)}) and XIRR (${pct(dip.xirr)} vs ${pct(sip.xirr)}).`, accent: "border-emerald-700/50 bg-emerald-950/30 text-emerald-400" };
    if (sipWinsOnBoth)
      return { text: `Regular SIP outperforms on both absolute return and XIRR for this period.`, accent: "border-slate-700 bg-slate-800/30 text-slate-300" };
    if (dipHigherValue)
      return { text: `Buy the Dip earns more in absolute terms (+${cur}${fmt(dip.final_value - sip.final_value)}) but Regular SIP has a higher XIRR (${pct(sip.xirr)} vs ${pct(dip.xirr)}). The extra capital on dips was less efficient per rupee.`, accent: "border-blue-700/50 bg-blue-950/30 text-blue-300" };
    return { text: `Regular SIP earns more in absolute terms but Buy the Dip has a higher XIRR (${pct(dip.xirr)} vs ${pct(sip.xirr)}) — each rupee worked harder.`, accent: "border-blue-700/50 bg-blue-950/30 text-blue-300" };
  }

  const { text, accent } = verdict();

  const rows = [
    {
      label: "Total Invested",
      sip: `${cur}${fmt(sip.total_invested)}`,
      dip: `${cur}${fmt(dip.total_invested)}`,
      sipClass: "text-slate-200",
      dipClass: "text-blue-300",
    },
    {
      label: "Final Value",
      sip: `${cur}${fmt(sip.final_value)}`,
      dip: `${cur}${fmt(dip.final_value)}`,
      sipClass: "text-slate-200",
      dipClass: "text-blue-300",
    },
    {
      label: "Gain / Loss",
      sip: `${sipGain >= 0 ? "+" : ""}${cur}${fmt(sipGain)}`,
      dip: `${dipGain >= 0 ? "+" : ""}${cur}${fmt(dipGain)}`,
      sipClass: sipGain >= 0 ? "text-emerald-400" : "text-red-400",
      dipClass: dipGain >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "XIRR",
      sip: pct(sip.xirr),
      dip: pct(dip.xirr),
      sipClass: "text-slate-200",
      dipClass: "text-blue-300",
    },
    {
      label: "Months Invested",
      sip: String(sip.num_investments),
      dip: String(dip.num_investments),
      sipClass: "text-slate-400",
      dipClass: "text-slate-400",
    },
    {
      label: "Dip Months",
      sublabel: "invested extra",
      sip: "—",
      dip: String(dip.dip_triggers ?? "—"),
      sipClass: "text-slate-600",
      dipClass: "text-blue-300",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <div className={`px-4 py-3 rounded-lg border text-xs leading-relaxed font-medium ${accent}`}>
        {text}
      </div>

      {/* Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Metric
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Regular SIP
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-widest text-blue-500 uppercase">
                Buy the Dip
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {row.label}
                  {row.sublabel && (
                    <span className="ml-1.5 text-slate-600">({row.sublabel})</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right font-mono text-xs num font-semibold ${row.sipClass}`}>
                  {row.sip}
                </td>
                <td className={`px-4 py-3 text-right font-mono text-xs num font-semibold ${row.dipClass}`}>
                  {row.dip}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-5">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-4">
          Portfolio Value Over Time
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }}
              tickFormatter={(d) => d.slice(0, 7)}
              interval={Math.max(1, Math.floor(chartData.length / 8))}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#e2e8f0",
              }}
              formatter={(v: number) => `${cur}${fmt(v)}`}
              labelFormatter={(l) => `${l}`}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "12px" }}
            />
            <Line type="monotone" dataKey="Regular SIP" stroke="#64748b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Buy the Dip" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="SIP Invested" stroke="#334155" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Dip Invested" stroke="#1e3a5f" strokeWidth={1} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
