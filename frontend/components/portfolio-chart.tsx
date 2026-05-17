"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { BacktestResponse } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";

type PortfolioChartProps = {
  result: BacktestResponse;
};

export function PortfolioChart({ result }: PortfolioChartProps) {
  const currency = result.asset.currency;
  const labelMap = Object.fromEntries(
    result.strategies.map((strategy) => [strategy.chartKey, strategy.label]),
  );
  labelMap.cashReserveValue = "Cash Reserve";
  labelMap.regularSipInvested = "SIP Invested";
  labelMap.buyTheDipInvested = "Dip Invested";
  const chartData = withInvestedReferenceLines(result);

  return (
    <section className="nsip-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-100">Portfolio Value Over Time</h2>
        <p className="text-xs text-slate-500">Strategy value lines with invested and reserve reference lines.</p>
      </div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              minTickGap={40}
              tickFormatter={(value) => String(value).slice(0, 7)}
              tick={{ fill: "#64748b", fontSize: 12, fontFamily: "monospace" }}
            />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
              tick={{ fill: "#64748b", fontSize: 12, fontFamily: "monospace" }}
              width={76}
            />
            <Tooltip
              formatter={(value, name) => [
                formatMoney(Number(value ?? 0), currency),
                labelMap[String(name)] ?? String(name),
              ]}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 6,
                color: "#e2e8f0",
                fontFamily: "monospace",
                fontSize: 11,
              }}
            />
            {result.strategies.map((strategy) => (
              <Line
                key={strategy.id}
                type="monotone"
                dataKey={strategy.chartKey}
                name={strategy.chartKey}
                stroke={strategyColors[strategy.id] ?? "#475569"}
                strokeWidth={2}
                dot={false}
              />
            ))}
            <Line
              type="monotone"
              dataKey="cashReserveValue"
              name="cashReserveValue"
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="regularSipInvested"
              name="regularSipInvested"
              stroke="#334155"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="buyTheDipInvested"
              name="buyTheDipInvested"
              stroke="#1e3a5f"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function withInvestedReferenceLines(result: BacktestResponse) {
  const regularEvents = [...(result.strategies.find((strategy) => strategy.id === "REGULAR_SIP")?.events ?? [])].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
  const dipEvents = [...(result.strategies.find((strategy) => strategy.id === "BUY_THE_DIP")?.events ?? [])].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
  let regularIndex = 0;
  let dipIndex = 0;
  let regularInvested = 0;
  let dipInvested = 0;

  return result.chart.map((point) => {
    while (regularIndex < regularEvents.length && regularEvents[regularIndex].date <= point.date) {
      regularInvested += regularEvents[regularIndex].amountInvested;
      regularIndex += 1;
    }
    while (dipIndex < dipEvents.length && dipEvents[dipIndex].date <= point.date) {
      dipInvested += dipEvents[dipIndex].amountInvested;
      dipIndex += 1;
    }
    return {
      ...point,
      regularSipInvested: regularInvested,
      buyTheDipInvested: dipInvested,
    };
  });
}

const strategyColors: Record<string, string> = {
  REGULAR_SIP: "#64748b",
  BUY_THE_DIP: "#3b82f6",
  RESERVE_BUY_THE_DIP: "#34d399",
  RSI_DIP: "#8b5cf6",
  MOMENTUM_BOOST: "#f59e0b",
};

function formatCompactCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
