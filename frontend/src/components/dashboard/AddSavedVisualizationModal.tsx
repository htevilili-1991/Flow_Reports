"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button, Modal } from "@/components/ui";

export interface ChartOptionsResponse {
  title?: string;
  x_axis_label?: string;
  y_axis_label?: string;
  show_legend?: boolean;
}

export interface SavedVisualizationItem {
  id: number;
  data_source: number;
  name: string;
  table_name?: string;
  sql?: string;
  question: number | null;
  question_title: string | null;
  chart_type: string;
  column_mapping: Record<string, unknown>;
  chart_options?: ChartOptionsResponse;
  created_at: string;
  updated_at: string;
}

const CHART_LABELS: Record<string, string> = {
  line: "Line",
  bar: "Bar",
  area: "Area",
  pie: "Pie",
  table: "Table",
};

interface AddSavedVisualizationModalProps {
  open: boolean;
  onClose: () => void;
  dataSourceId: number | null;
  onAdd: (viz: SavedVisualizationItem) => void;
}

export function AddSavedVisualizationModal({
  open,
  onClose,
  dataSourceId,
  onAdd,
}: AddSavedVisualizationModalProps) {
  const [list, setList] = useState<SavedVisualizationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadVisualizations = useCallback(async () => {
    if (!dataSourceId) return;
    setLoading(true);
    setError("");
    const res = await authFetch(
      `/api/data-sources/${dataSourceId}/visualizations/`
    );
    setLoading(false);
    if (!res.ok) {
      setError("Failed to load visualizations.");
      setList([]);
      return;
    }
    const data = await res.json();
    setList(data);
  }, [dataSourceId]);

  useEffect(() => {
    if (open && dataSourceId) loadVisualizations();
    else if (!open) setList([]);
  }, [open, dataSourceId, loadVisualizations]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add visualization"
      maxWidth="lg"
    >
      <div className="px-5 py-4">
        <p className="text-sm text-zinc-600 mb-4">
          Choose a saved visualization from this dashboard&apos;s data source. Only visualizations from one data source can be added to a dashboard.
        </p>
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No visualizations for this data source yet. Create them under Data sources → [Your source] → Visualizations.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((viz) => (
              <li
                key={viz.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
              >
                <div>
                  <span className="font-medium text-zinc-900">{viz.name}</span>
                  <span className="ml-2 text-sm text-zinc-500">
                    {CHART_LABELS[viz.chart_type] || viz.chart_type}
                    {viz.question_title && ` · ${viz.question_title}`}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onAdd(viz);
                    onClose();
                  }}
                  disabled={!viz.table_name && !viz.sql && viz.question == null}
                  title={
                    !viz.table_name && !viz.sql && viz.question == null
                      ? "This visualization has no data source (table or SQL)"
                      : undefined
                  }
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end border-t border-zinc-100 px-5 py-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
