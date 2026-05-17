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
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-950">Strategy Configuration</h2>
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
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-slate-950">Cash Reserve Simulator</span>
          </span>
          <input
            {...register("reserveEnabled")}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
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
              className={`${inputClassName} disabled:bg-slate-100 disabled:text-slate-400`}
            />
          </Field>
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">Reserve contribution %</span>
            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950">
              {reserveEnabled ? `${reservePercent}%` : "0%"}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Strategy Battle Arena</h3>
        </div>
        <div className="mt-2 space-y-2">
          <label className="flex items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 text-sm">
            <span className="font-medium text-slate-700">RSI Dip</span>
            <input
              {...register("rsiDipEnabled")}
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
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
          <label className="flex items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 text-sm">
            <span className="font-medium text-slate-700">Momentum Boost</span>
            <input
              {...register("momentumBoostEnabled")}
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
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
        className="mt-3 h-9 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Running backtest" : "Run backtest"}
      </button>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  );
}

const inputClassName =
  "h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200";
