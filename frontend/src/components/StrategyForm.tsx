"use client";

import { useState } from "react";
import DatePicker from "@/components/DatePicker";

export interface FormState {
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  dipPct: number;
  deployMultiplier: number;
}

interface Props {
  onSubmit: (params: FormState) => void;
  loading: boolean;
  error: string | null;
}

const today = new Date().toISOString().split("T")[0];
const fiveYearsAgo = new Date(Date.now() - 5 * 365.25 * 24 * 3600 * 1000)
  .toISOString()
  .split("T")[0];

function validate(form: FormState): string | null {
  if (!form.startDate || !form.endDate) return "Select a start and end date.";
  if (form.startDate >= form.endDate) return "Start date must be before end date.";
  const months =
    (new Date(form.endDate).getFullYear() - new Date(form.startDate).getFullYear()) * 12 +
    (new Date(form.endDate).getMonth() - new Date(form.startDate).getMonth());
  if (months < 12) return "Range must be at least 1 year — 200-day SMA needs enough history.";
  if (!form.monthlyAmount || form.monthlyAmount <= 0) return "Monthly amount must be greater than 0.";
  if (form.dipPct <= 0 || form.dipPct > 50) return "Dip threshold must be between 1% and 50%.";
  if (form.deployMultiplier < 1) return "Deploy multiplier must be at least 1×.";
  return null;
}

const inputClass =
  "mt-1 w-full bg-[#080c14] border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono";

const labelClass = "text-xs font-semibold tracking-widest text-slate-500 uppercase";

export default function StrategyForm({ onSubmit, loading, error }: Props) {
  const [form, setForm] = useState<FormState>({
    startDate: fiveYearsAgo,
    endDate: today,
    monthlyAmount: 5000,
    dipPct: 5,
    deployMultiplier: 2,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.type === "number" ? parseFloat(e.target.value) : e.target.value;
      setForm((f) => ({ ...f, [key]: val }));
      setValidationError(null);
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(form);
    if (err) { setValidationError(err); return; }
    onSubmit(form);
  }

  const displayError = validationError || error;

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-5">
      <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-4">
        Configuration
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={form.startDate}
            onChange={(d) => { setForm((f) => ({ ...f, startDate: d })); setValidationError(null); }}
            max={today}
          />
          <DatePicker
            label="End Date"
            value={form.endDate}
            onChange={(d) => { setForm((f) => ({ ...f, endDate: d })); setValidationError(null); }}
            max={today}
          />
        </div>

        <label className="block">
          <span className={labelClass}>Monthly SIP Amount</span>
          <input type="number" value={form.monthlyAmount} onChange={set("monthlyAmount")} min={1} className={inputClass} />
        </label>

        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Buy the Dip — Parameters
            </p>
          </div>
          <div className="mb-3 flex items-start gap-2 bg-amber-950/30 border border-amber-800/30 rounded-md px-3 py-2">
            <span className="text-amber-500 text-xs mt-0.5">⚠</span>
            <p className="text-xs text-amber-500/80 leading-relaxed">
              Requires a war chest — extra capital must be available to deploy on dip months beyond your regular SIP.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Dip Threshold (%)</span>
              <span className="block text-xs text-slate-600 mb-1">% below 200-day SMA</span>
              <input type="number" value={form.dipPct} onChange={set("dipPct")} min={1} max={50} step={0.5} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Deploy Multiplier (×)</span>
              <span className="block text-xs text-slate-600 mb-1">× SIP amount on dip</span>
              <input type="number" value={form.deployMultiplier} onChange={set("deployMultiplier")} min={1} max={10} step={0.5} className={inputClass} />
            </label>
          </div>
        </div>

        {displayError && (
          <p className="text-xs text-red-400 font-mono border border-red-900/50 bg-red-950/20 rounded-md px-3 py-2">
            {displayError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md disabled:opacity-40 transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {loading ? "Running Backtest..." : "Run Backtest"}
        </button>
      </form>
    </div>
  );
}
