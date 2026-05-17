"use client";

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
      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="mb-3">
          <p className="nsip-label">Buy the Dip — Parameters</p>
        </div>
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-800/30 bg-amber-950/30 px-3 py-2">
          <span className="mt-0.5 text-xs text-amber-500">!</span>
          <p className="text-xs leading-relaxed text-amber-500/80">
            Requires a war chest. Extra capital must be available to deploy on dip months beyond the regular SIP.
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-slate-800 bg-[#080c14] p-2.5">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-slate-100">Cash Reserve Simulator</span>
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
            <div className="flex h-10 items-center rounded-md border border-slate-700 bg-[#0b1120] px-3 text-sm font-medium text-slate-100">
              {reserveEnabled ? `${reservePercent}%` : "0%"}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-slate-800 bg-[#080c14] p-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Strategy Battle Arena</h3>
        </div>
        <div className="mt-2 space-y-2">
          <label className="flex items-center justify-between gap-3 rounded-md bg-[#0b1120] px-2.5 py-1.5 text-sm">
            <span className="font-medium text-slate-300">RSI Dip</span>
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
          <label className="flex items-center justify-between gap-3 rounded-md bg-[#0b1120] px-2.5 py-1.5 text-sm">
            <span className="font-medium text-slate-300">Momentum Boost</span>
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-400">{error}</span> : null}
    </label>
  );
}

const inputClassName =
  "nsip-input";
