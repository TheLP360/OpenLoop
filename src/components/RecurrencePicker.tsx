"use client";

import { useState } from "react";
import {
  buildRule,
  humanize,
  parseRule,
  WEEKDAY_LABELS,
  type Frequency,
} from "@/lib/recurrence";
import { cn } from "@/lib/utils";

const FREQS: { value: Frequency; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

// Emits a compact RRULE into a hidden input named `recurrence_rule`.
export function RecurrencePicker({ defaultValue }: { defaultValue?: string | null }) {
  const initial = parseRule(defaultValue);
  const [enabled, setEnabled] = useState(!!initial);
  const [freq, setFreq] = useState<Frequency>(initial?.freq ?? "WEEKLY");
  const [interval, setInterval] = useState(initial?.interval ?? 1);
  const [byday, setByday] = useState<number[]>(initial?.byday ?? []);

  const rule = enabled ? buildRule({ freq, interval, byday }) : "";

  function toggleDay(d: number) {
    setByday((days) => (days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort()));
  }

  return (
    <div className="card px-4 py-3">
      <input type="hidden" name="recurrence_rule" value={rule} />

      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Repeats</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-loop-600"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Every</span>
            <input
              type="number"
              min={1}
              className="input w-16"
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <select
              className="input flex-1"
              value={freq}
              onChange={(e) => setFreq(e.target.value as Frequency)}
            >
              {FREQS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {freq === "WEEKLY" && (
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-medium transition",
                    byday.includes(d)
                      ? "bg-loop-600 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {label[0]}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-400">
            {humanize(rule) || "Pick a schedule"} · spawns the next occurrence when completed.
          </p>
        </div>
      )}
    </div>
  );
}
