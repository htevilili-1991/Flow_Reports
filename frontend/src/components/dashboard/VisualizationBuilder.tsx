"use client";

import { useState, useCallback } from "react";
import type { ChartType, ColumnMapping } from "./AddVisualizationModal";

export interface ChartOptions {
  title?: string;
  x_axis_label?: string;
  y_axis_label?: string;
  show_legend?: boolean;
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "table", label: "Table" },
];

interface VisualizationBuilderProps {
  columns: string[];
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  mapping: ColumnMapping;
  onMappingChange: (m: ColumnMapping) => void;
  chartOptions: ChartOptions;
  onChartOptionsChange: (o: ChartOptions) => void;
  name: string;
  onNameChange: (n: string) => void;
}

function DropZone({
  label,
  value,
  onDrop,
  onClear,
  acceptMultiple,
  values,
  onClearOne,
}: {
  label: string;
  value?: string;
  onDrop: (col: string) => void;
  onClear: () => void;
  acceptMultiple?: boolean;
  values?: string[];
  onClearOne?: (col: string) => void;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2", "ring-blue-400", "bg-blue-50/50");
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-blue-400", "bg-blue-50/50");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-blue-400", "bg-blue-50/50");
    const col = e.dataTransfer.getData("text/plain");
    if (col) onDrop(col);
  };

  if (acceptMultiple && values !== undefined) {
    return (
      <div
        className="min-h-[44px] rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-2 transition-colors"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="block text-xs font-medium text-zinc-500 mb-1">{label}</span>
        <div className="flex flex-wrap gap-1">
          {values.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-sm text-blue-800"
            >
              {c}
              <button
                type="button"
                onClick={() => onClearOne?.(c)}
                className="hover:text-blue-600"
                aria-label={`Remove ${c}`}
              >
                ×
              </button>
            </span>
          ))}
          {values.length === 0 && (
            <span className="text-xs text-zinc-400">Drag columns here</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[44px] rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-2 transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="block text-xs font-medium text-zinc-500 mb-1">{label}</span>
      <div className="flex items-center justify-between gap-2">
        {value ? (
          <>
            <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">{value}</span>
            <button
              type="button"
              onClick={onClear}
              className="text-zinc-400 hover:text-zinc-600 text-sm"
              aria-label="Clear"
            >
              Clear
            </button>
          </>
        ) : (
          <span className="text-xs text-zinc-400">Drag a variable here</span>
        )}
      </div>
    </div>
  );
}

export function VisualizationBuilder({
  columns,
  chartType,
  onChartTypeChange,
  mapping,
  onMappingChange,
  chartOptions,
  onChartOptionsChange,
  name,
  onNameChange,
}: VisualizationBuilderProps) {
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  const handleDropOnSlot = useCallback(
    (slot: keyof ColumnMapping, col: string) => {
      if (slot === "tableColumns") {
        const current = mapping.tableColumns ?? [];
        if (current.includes(col)) return;
        onMappingChange({ ...mapping, tableColumns: [...current, col] });
      } else {
        onMappingChange({ ...mapping, [slot]: col });
      }
    },
    [mapping, onMappingChange]
  );

  const clearSlot = useCallback(
    (slot: keyof ColumnMapping) => {
      if (slot === "tableColumns") {
        onMappingChange({ ...mapping, tableColumns: [] });
      } else {
        const next = { ...mapping };
        delete next[slot];
        onMappingChange(next);
      }
    },
    [mapping, onMappingChange]
  );

  const removeTableColumn = useCallback(
    (col: string) => {
      onMappingChange({
        ...mapping,
        tableColumns: (mapping.tableColumns ?? []).filter((c) => c !== col),
      });
    },
    [mapping, onMappingChange]
  );

  return (
    <div className="space-y-6">
      {/* Chart type */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">Chart type</label>
        <div className="flex flex-wrap gap-2">
          {CHART_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChartTypeChange(value)}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                chartType === value
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Variables (draggable) + Drop zones */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Variables</label>
          <p className="text-xs text-zinc-500 mb-2">Drag variables into the drop zones on the right.</p>
          <div className="flex flex-wrap gap-2 min-h-[80px] rounded-lg border border-zinc-200 bg-zinc-50/30 p-3">
            {columns.length === 0 && (
              <span className="text-sm text-zinc-400">Load columns from a saved question first.</span>
            )}
            {columns.length > 0 &&
              columns.map((col) => (
                <span
                  key={col}
                  draggable
                  onDragStart={(e) => {
                    setDraggedCol(col);
                    e.dataTransfer.setData("text/plain", col);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onDragEnd={() => setDraggedCol(null)}
                  className={`cursor-grab rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm active:cursor-grabbing ${
                    draggedCol === col ? "opacity-50" : "hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  {col}
                </span>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Drop zones</label>
          <div className="space-y-3">
            {chartType === "table" && (
              <DropZone
                label="Columns to show (order: drag order)"
                acceptMultiple
                values={mapping.tableColumns ?? []}
                onDrop={(col) => handleDropOnSlot("tableColumns", col)}
                onClear={() => clearSlot("tableColumns")}
                onClearOne={removeTableColumn}
              />
            )}
            {chartType === "pie" && (
              <>
                <DropZone
                  label="Label"
                  value={mapping.label}
                  onDrop={(col) => handleDropOnSlot("label", col)}
                  onClear={() => clearSlot("label")}
                />
                <DropZone
                  label="Value"
                  value={mapping.value}
                  onDrop={(col) => handleDropOnSlot("value", col)}
                  onClear={() => clearSlot("value")}
                />
              </>
            )}
            {(chartType === "line" || chartType === "bar" || chartType === "area") && (
              <>
                <DropZone
                  label="X axis"
                  value={mapping.x}
                  onDrop={(col) => handleDropOnSlot("x", col)}
                  onClear={() => clearSlot("x")}
                />
                <DropZone
                  label="Y axis"
                  value={mapping.y}
                  onDrop={(col) => handleDropOnSlot("y", col)}
                  onClear={() => clearSlot("y")}
                />
                <DropZone
                  label="Series / breakdown (optional)"
                  value={mapping.series}
                  onDrop={(col) => handleDropOnSlot("series", col)}
                  onClear={() => clearSlot("series")}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Customize */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/30 p-4">
        <label className="block text-sm font-medium text-zinc-700 mb-3">Customize</label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Visualization title</label>
            <input
              type="text"
              value={chartOptions.title ?? name}
              onChange={(e) => onChartOptionsChange({ ...chartOptions, title: e.target.value })}
              placeholder="e.g. Sales by region"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          {(chartType === "line" || chartType === "bar" || chartType === "area") && (
            <>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">X axis label</label>
                <input
                  type="text"
                  value={chartOptions.x_axis_label ?? ""}
                  onChange={(e) =>
                    onChartOptionsChange({ ...chartOptions, x_axis_label: e.target.value || undefined })
                  }
                  placeholder="Optional"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Y axis label</label>
                <input
                  type="text"
                  value={chartOptions.y_axis_label ?? ""}
                  onChange={(e) =>
                    onChartOptionsChange({ ...chartOptions, y_axis_label: e.target.value || undefined })
                  }
                  placeholder="Optional"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              id="show_legend"
              checked={chartOptions.show_legend !== false}
              onChange={(e) =>
                onChartOptionsChange({ ...chartOptions, show_legend: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="show_legend" className="text-sm text-zinc-700">
              Show legend
            </label>
          </div>
        </div>
      </div>

      {/* Name (for save) */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Save as (name)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Sales by region"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
