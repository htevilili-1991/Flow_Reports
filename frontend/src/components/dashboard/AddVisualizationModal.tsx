"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button, Modal } from "@/components/ui";

export type ChartType = "line" | "bar" | "pie" | "table" | "area";

export interface ColumnMapping {
  x?: string;
  y?: string;
  series?: string;
  label?: string;
  value?: string;
  tableColumns?: string[];
}

export interface VisualizationConfig {
  questionId: number;
  questionTitle: string;
  chartType: ChartType;
  title: string;
  columnMapping: ColumnMapping;
}

interface SavedQuestion {
  id: number;
  title: string;
  natural_language: string;
  created_at: string;
  updated_at: string;
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "line", label: "Line chart" },
  { value: "bar", label: "Bar chart" },
  { value: "area", label: "Area chart" },
  { value: "pie", label: "Pie chart" },
  { value: "table", label: "Table" },
];

interface AddVisualizationModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (config: VisualizationConfig) => void;
}

export function AddVisualizationModal({
  open,
  onClose,
  onAdd,
}: AddVisualizationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | "">("");
  const [columns, setColumns] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<Record<string, unknown>[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [columnsError, setColumnsError] = useState("");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [widgetTitle, setWidgetTitle] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  const loadQuestions = useCallback(async () => {
    const res = await authFetch("/api/questions/");
    if (!res.ok) return;
    const data = await res.json();
    setQuestions(data);
  }, []);

  useEffect(() => {
    if (open) loadQuestions();
  }, [open, loadQuestions]);

  const loadColumns = useCallback(async () => {
    if (!selectedQuestionId || typeof selectedQuestionId !== "number") return;
    setLoadingColumns(true);
    setColumnsError("");
    const res = await authFetch("/api/questions/run/", {
      method: "POST",
      body: JSON.stringify({ question_id: selectedQuestionId }),
    });
    setLoadingColumns(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setColumnsError((data as { error?: string }).error || "Failed to run query.");
      setColumns([]);
      setSampleRows([]);
      return;
    }
    const rows = (data as { rows?: Record<string, unknown>[] }).rows ?? [];
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    setColumns(cols);
    setSampleRows(rows.slice(0, 5));
    setMapping({});
  }, [selectedQuestionId]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedQuestionId("");
    setColumns([]);
    setSampleRows([]);
    setChartType("line");
    setWidgetTitle(selectedQuestion?.title ?? "New chart");
    setMapping({});
    setColumnsError("");
  }, [open]);

  useEffect(() => {
    if (selectedQuestionId && open) setWidgetTitle(selectedQuestion?.title ?? "New chart");
  }, [selectedQuestionId, selectedQuestion, open]);

  const canGoStep2 = selectedQuestionId !== "" && columns.length > 0;
  const canGoStep3 =
    chartType === "table"
      ? columns.length > 0
      : chartType === "pie"
        ? !!mapping.label && !!mapping.value
        : !!mapping.x && !!mapping.y;

  const handleAdd = () => {
    if (!selectedQuestion || !selectedQuestionId) return;
    onAdd({
      questionId: selectedQuestionId as number,
      questionTitle: selectedQuestion.title,
      chartType,
      title: widgetTitle.trim() || selectedQuestion.title,
      columnMapping: { ...mapping },
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add visualization" maxWidth="xl">
      <div className="border-b border-zinc-100 px-5 py-3 flex items-center gap-2 text-sm text-zinc-600">
        <span className={step >= 1 ? "font-medium text-zinc-900" : ""}>1. Data</span>
        <span>/</span>
        <span className={step >= 2 ? "font-medium text-zinc-900" : ""}>2. Chart type</span>
        <span>/</span>
        <span className={step >= 3 ? "font-medium text-zinc-900" : ""}>3. Columns</span>
      </div>
      <div className="px-5 py-4 space-y-6">
        {/* Step 1: Select question + load columns */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700">Saved question</label>
          <select
            value={selectedQuestionId}
            onChange={(e) => {
              setSelectedQuestionId(e.target.value === "" ? "" : Number(e.target.value));
              setColumns([]);
              setSampleRows([]);
            }}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select a question…</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title || `Question #${q.id}`}
              </option>
            ))}
          </select>
          {questions.length === 0 && (
            <p className="text-sm text-zinc-500">No saved questions. Create one under Questions first.</p>
          )}
          {selectedQuestionId !== "" && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadColumns}
                isLoading={loadingColumns}
              >
                Load columns
              </Button>
              {columns.length > 0 && (
                <span className="text-sm text-zinc-600">
                  {columns.length} column{columns.length !== 1 ? "s" : ""}: {columns.join(", ")}
                </span>
              )}
              {columnsError && (
                <span className="text-sm text-red-600">{columnsError}</span>
              )}
            </div>
          )}
        </div>

        {columns.length > 0 && (
          <>
            {/* Step 2: Chart type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">Chart type</label>
              <div className="flex flex-wrap gap-2">
                {CHART_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChartType(value)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                      chartType === value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Column mapping */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-700">Column mapping</label>
              {chartType === "table" ? (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Columns to show (order preserved)</p>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((col) => {
                      const selected = mapping.tableColumns?.includes(col) ?? false;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            const current = mapping.tableColumns ?? [];
                            setMapping({
                              ...mapping,
                              tableColumns: selected
                                ? current.filter((c) => c !== col)
                                : [...current, col],
                            });
                          }}
                          className={`rounded border px-2 py-1 text-sm ${
                            selected
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : chartType === "pie" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Label</label>
                    <select
                      value={mapping.label ?? ""}
                      onChange={(e) => setMapping({ ...mapping, label: e.target.value || undefined })}
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">—</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Value</label>
                    <select
                      value={mapping.value ?? ""}
                      onChange={(e) => setMapping({ ...mapping, value: e.target.value || undefined })}
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">—</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">X axis</label>
                    <select
                      value={mapping.x ?? ""}
                      onChange={(e) => setMapping({ ...mapping, x: e.target.value || undefined })}
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">—</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Y axis</label>
                    <select
                      value={mapping.y ?? ""}
                      onChange={(e) => setMapping({ ...mapping, y: e.target.value || undefined })}
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">—</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-500 mb-1">Series / breakdown (optional)</label>
                    <select
                      value={mapping.series ?? ""}
                      onChange={(e) => setMapping({ ...mapping, series: e.target.value || undefined })}
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">None</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Widget title */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Widget title</label>
              <input
                type="text"
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                placeholder="Chart title"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAdd}
          disabled={!selectedQuestionId || columns.length === 0 || !canGoStep3}
        >
          Add to dashboard
        </Button>
      </div>
    </Modal>
  );
}
