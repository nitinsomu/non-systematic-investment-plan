"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";

interface Props {
  label: string;
  value: string;
  onChange: (date: string) => void;
  max?: string;
}

const chevronLeft = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const chevronRight = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function DatePicker({ label, value, onChange, max }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? parseISO(value) : undefined;
  const maxDate = max ? parseISO(max) : undefined;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 w-full bg-[#080c14] border border-slate-700 hover:border-slate-500 rounded-md px-3 py-2 text-sm text-slate-200 font-mono text-left flex items-center justify-between focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        <span>{selected ? format(selected, "dd MMM yyyy") : "Select date"}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-slate-500">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-[#0b1120] border border-slate-700 rounded-lg shadow-2xl p-3 min-w-[260px]">
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            fromYear={1990}
            toYear={new Date().getFullYear()}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            disabled={maxDate ? { after: maxDate } : undefined}
            components={{
              IconLeft: () => chevronLeft,
              IconRight: () => chevronRight,
            }}
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex justify-between items-center px-1 pb-2 border-b border-slate-800",
              caption_label: "hidden",
              caption_dropdowns: "flex items-center gap-2",
              dropdown:
                "bg-[#080c14] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 font-mono focus:outline-none focus:border-blue-500 cursor-pointer appearance-none",
              dropdown_month: "",
              dropdown_year: "",
              vhidden: "hidden",
              nav: "flex items-center gap-1",
              nav_button:
                "h-6 w-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors",
              nav_button_previous: "",
              nav_button_next: "",
              table: "w-full mt-2",
              head_row: "flex mb-1",
              head_cell: "text-slate-600 font-mono text-xs w-9 text-center font-semibold",
              row: "flex",
              cell: "w-9 h-9 text-center p-0",
              day: "w-9 h-9 font-mono text-xs rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors mx-auto",
              day_selected: "bg-blue-600 text-white hover:bg-blue-500 hover:text-white font-semibold",
              day_today: "text-blue-400 font-bold",
              day_outside: "text-slate-700 hover:text-slate-600",
              day_disabled: "text-slate-800 cursor-not-allowed hover:bg-transparent hover:text-slate-800",
            }}
          />
        </div>
      )}
    </div>
  );
}
