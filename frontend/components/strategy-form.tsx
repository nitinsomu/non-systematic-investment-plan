"use client";

import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { BacktestFormValues } from "@/lib/schemas";

type StrategyFormProps = {
  register: UseFormRegister<BacktestFormValues>;
  errors: FieldErrors<BacktestFormValues>;
  isLoading: boolean;
  reserveEnabled: boolean;
  baseSipPercent: number;
};

export function StrategyForm({ register, errors, isLoading, reserveEnabled, baseSipPercent }: StrategyFormProps) {
  const reservePercent = Number.isFinite(baseSipPercent) ? 100 - baseSipPercent : 50;

  return (
    <section className="nsip-card p-5">
      <div className="mb-3">
        <p className="nsip-label">Configuration</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Currency" error={errors.currency?.message}>
          <input {...register("currency")} className={inputClassName} />
        </Field>
        <Field label="Monthly SIP amount" error={errors.monthlyAmount?.message}>
          <input {...register("monthlyAmount", { valueAsNumber: true })} type="number" min="1" className={inputClassName} />
        </Field>
        <Field label="Start date" error={errors.startDate?.message}>
          <input {...register("startDate")} type="date" className={inputClassName} />
        </Field>
        <Field label="End date" error={errors.endDate?.message}>
          <input {...register("endDate")} type="date" className={inputClassName} />
        </Field>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <p className="nsip-label">Buy the Dip — Parameters</p>
          <InfoTooltip text="These three settings control when and how much extra is invested on a dip. The moving average smooths out daily noise to show the long-term price trend. The dip threshold sets how far below that average the price must fall before it counts as a dip. The deploy multiplier decides how much more you invest when a dip is detected — e.g. 2× doubles your usual SIP amount." />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Dip threshold %" error={errors.dipThresholdPercent?.message}>
            <input {...register("dipThresholdPercent", { valueAsNumber: true })} type="number" min="0.1" step="0.1" className={inputClassName} />
          </Field>
          <Field label="Moving average days" error={errors.movingAverageDays?.message}>
            <input {...register("movingAverageDays", { valueAsNumber: true })} type="number" min="20" className={inputClassName} />
          </Field>
          <Field label="Deploy multiplier" error={errors.deployMultiplier?.message}>
            <input {...register("deployMultiplier", { valueAsNumber: true })} type="number" min="1" step="0.1" className={inputClassName} />
          </Field>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <p className="nsip-label">Optional strategies</p>
        </div>
      </div>

      <div className="mt-2 rounded-md border border-slate-800 bg-[#080c14] p-2.5">
        <label className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="block text-sm font-semibold text-slate-100">Cash Reserve Simulator</span>
            <InfoTooltip text="A more realistic version of Buy the Dip. Instead of assuming you always have spare cash ready, this saves a slice of your SIP each month into a reserve. When a dip is detected, it spends from that reserve — so you can never invest more than you actually saved up." />
          </span>
          <input
            {...register("reserveEnabled")}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 text-emerald-400 focus:ring-emerald-500"
          />
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Base SIP %" error={errors.baseSipPercent?.message}>
            <input
              {...register("baseSipPercent", { valueAsNumber: true })}
              type="number"
              min="1"
              max="99"
              disabled={!reserveEnabled}
              className={`${inputClassName} disabled:bg-slate-900 disabled:text-slate-500`}
            />
          </Field>
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-500">Reserve contribution %</span>
            <div className="flex h-9 items-center rounded-md border border-slate-700 bg-[#0b1120] px-3 text-sm font-medium text-slate-100">
              {reserveEnabled ? `${reservePercent}%` : "0%"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-md border border-slate-800 bg-[#080c14] p-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-slate-100">RSI Dip</h3>
          <InfoTooltip text="RSI (Relative Strength Index) measures recent buying and selling pressure on a scale of 0–100. A reading below 30 typically means a stock has been heavily sold off and may be due for a bounce. This strategy invests more when RSI drops below your threshold." />
        </div>
        <label className="mb-2 flex items-center justify-between gap-3 rounded-md bg-[#0b1120] px-2.5 py-1.5 text-sm">
          <span className="font-medium text-slate-300">Enable RSI Dip</span>
          <input
            {...register("rsiDipEnabled")}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 text-emerald-400 focus:ring-emerald-500"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="RSI period" error={errors.rsiPeriod?.message}>
            <input {...register("rsiPeriod", { valueAsNumber: true })} type="number" min="2" className={inputClassName} />
          </Field>
          <Field label="RSI threshold" error={errors.rsiThreshold?.message}>
            <input {...register("rsiThreshold", { valueAsNumber: true })} type="number" min="1" max="99" className={inputClassName} />
          </Field>
        </div>
      </div>

      <div className="mt-2 rounded-md border border-slate-800 bg-[#080c14] p-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-slate-100">Momentum Boost</h3>
          <InfoTooltip text="The opposite of dip-buying. Invests more when the price is above its moving average, betting that upward momentum will continue. Useful to test whether riding winners beats buying dips for a given asset." />
        </div>
        <label className="mb-2 flex items-center justify-between gap-3 rounded-md bg-[#0b1120] px-2.5 py-1.5 text-sm">
          <span className="font-medium text-slate-300">Enable Momentum Boost</span>
          <input
            {...register("momentumBoostEnabled")}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 text-emerald-400 focus:ring-emerald-500"
          />
        </label>
        <Field label="Momentum average days" error={errors.momentumAverageDays?.message}>
          <input
            {...register("momentumAverageDays", { valueAsNumber: true })}
            type="number"
            min="5"
            className={inputClassName}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="nsip-button mt-3 h-10 w-full px-4 text-xs font-bold uppercase tracking-widest"
      >
        {isLoading ? "Running backtest" : "Run backtest"}
      </button>
    </section>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="flex h-4 w-4 flex-none items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-400 hover:border-slate-500 hover:text-slate-200"
        aria-label="More info"
      >
        ?
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-slate-700 bg-[#0b1120] p-2.5 text-xs leading-relaxed text-slate-300 shadow-xl">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
        </span>
      )}
    </span>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-400">{error}</span> : null}
    </label>
  );
}

const inputClassName = "nsip-input";
