"use client";

import { format, subDays } from "date-fns";

export interface DateRange {
  start: string;
  end: string;
}

interface FilterBarProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selects?: Record<string, string[]>;
  onSelectsChange: (selects: Record<string, string[]>) => void;
  /** Optional: for multi-select dropdowns, key -> list of options */
  selectOptions?: Record<string, string[]>;
  className?: string;
}

export function FilterBar({
  dateRange,
  onDateRangeChange,
  selects = {},
  onSelectsChange,
  selectOptions = {},
  className = "",
}: FilterBarProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const last7 = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const last30 = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const clearSelect = (key: string) => {
    const next = { ...selects };
    delete next[key];
    onSelectsChange(next);
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-600">Date range</span>
        <input
          type="date"
          value={dateRange?.start ?? ""}
          onChange={(e) =>
            onDateRangeChange(
              e.target.value
                ? { start: e.target.value, end: dateRange?.end || today }
                : undefined
            )
          }
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <span className="text-zinc-400">to</span>
        <input
          type="date"
          value={dateRange?.end ?? ""}
          onChange={(e) =>
            onDateRangeChange(
              e.target.value
                ? { start: dateRange?.start || today, end: e.target.value }
                : undefined
            )
          }
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={() => onDateRangeChange({ start: last7, end: today })}
          className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => onDateRangeChange({ start: last30, end: today })}
          className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
        >
          Last 30 days
        </button>
        {dateRange && (
          <button
            type="button"
            onClick={() => onDateRangeChange(undefined)}
            className="text-xs text-zinc-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      {Object.keys(selectOptions).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-l border-zinc-200 pl-4">
          {Object.entries(selectOptions).map(([key, options]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-600">{key}</span>
              <select
                multiple
                value={selects[key] ?? []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (o) => o.value
                  );
                  onSelectsChange({ ...selects, [key]: selected });
                }}
                className="min-w-[120px] rounded border border-zinc-300 px-2 py-1 text-sm"
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {(selects[key]?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => clearSelect(key)}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
