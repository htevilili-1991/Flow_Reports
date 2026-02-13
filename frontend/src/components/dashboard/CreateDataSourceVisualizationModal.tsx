"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Button, Modal } from "@/components/ui";
import type { ChartType, ColumnMapping } from "./AddVisualizationModal";
import { VisualizationBuilder, type ChartOptions } from "./VisualizationBuilder";

interface SchemaTable {
  name: string;
  columns: string[];
}

interface CreateDataSourceVisualizationModalProps {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  dataSourceName: string;
  onCreated: () => void;
}

export function CreateDataSourceVisualizationModal({
  open,
  onClose,
  dataSourceId,
  dataSourceName,
  onCreated,
}: CreateDataSourceVisualizationModalProps) {
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [customSql, setCustomSql] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [columnsError, setColumnsError] = useState("");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [name, setName] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [chartOptions, setChartOptions] = useState<ChartOptions>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSchema = useCallback(async () => {
    setSchemaLoading(true);
    setSchemaError("");
    const res = await authFetch(`/api/data-sources/${dataSourceId}/schema/`);
    const data = await res.json().catch(() => ({}));
    setSchemaLoading(false);
    if (!res.ok) {
      setSchemaError((data as { error?: string }).error || "Failed to load schema.");
      setSchema([]);
      return;
    }
    setSchema((data as { tables?: SchemaTable[] }).tables ?? []);
  }, [dataSourceId]);

  useEffect(() => {
    if (open) loadSchema();
  }, [open, loadSchema]);

  const loadVariablesFromTable = useCallback(() => {
    if (!selectedTable) return;
    const t = schema.find((x) => x.name === selectedTable);
    if (t) {
      setColumns(t.columns);
      setMapping({});
      setColumnsError("");
    }
  }, [schema, selectedTable]);

  const loadVariablesFromSql = useCallback(async () => {
    const sql = customSql.trim();
    if (!sql) return;
    setLoadingColumns(true);
    setColumnsError("");
    const res = await authFetch(`/api/data-sources/${dataSourceId}/run-query/`, {
      method: "POST",
      body: JSON.stringify({ sql }),
    });
    const data = await res.json().catch(() => ({}));
    setLoadingColumns(false);
    if (!res.ok) {
      setColumnsError((data as { error?: string }).error || "Failed to run query.");
      setColumns([]);
      return;
    }
    const cols = (data as { columns?: string[] }).columns ?? [];
    setColumns(cols);
    setMapping({});
  }, [dataSourceId, customSql]);

  useEffect(() => {
    if (selectedTable && schema.length > 0) loadVariablesFromTable();
    else if (!selectedTable && !customSql.trim()) setColumns([]);
  }, [selectedTable, schema, loadVariablesFromTable]);

  useEffect(() => {
    if (!open) return;
    setSelectedTable("");
    setCustomSql("");
    setColumns([]);
    setChartType("line");
    setMapping({});
    setChartOptions({});
    setColumnsError("");
    setSchemaError("");
    setError("");
    setName("");
  }, [open]);

  const hasData = selectedTable !== "" || customSql.trim() !== "";
  const canSave =
    name.trim() !== "" &&
    columns.length > 0 &&
    (chartType === "table"
      ? true
      : chartType === "pie"
        ? !!mapping.label && !!mapping.value
        : !!mapping.x && !!mapping.y);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = {
      data_source: dataSourceId,
      name: name.trim(),
      chart_type: chartType,
      column_mapping: mapping,
      chart_options: chartOptions,
    };
    if (selectedTable) body.table_name = selectedTable;
    else if (customSql.trim()) body.sql = customSql.trim();
    const res = await authFetch(
      `/api/data-sources/${dataSourceId}/visualizations/`,
      { method: "POST", body: JSON.stringify(body) }
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        (data as { detail?: string }).detail ||
          (data as { name?: string[] }).name?.[0] ||
          "Failed to save."
      );
      return;
    }
    onCreated();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Create visualization · ${dataSourceName}`}
      maxWidth="xl"
    >
      <div className="border-b border-zinc-100 px-5 py-3 text-sm text-zinc-600">
        Pick a <strong>table</strong> to see its variables, or enter <strong>custom SQL</strong>. Then drag variables into drop zones.
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 1. Data: table or custom SQL */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700">
            1. Data — choose table or SQL
          </label>
          {schemaLoading ? (
            <p className="text-sm text-zinc-500">Loading schema…</p>
          ) : schemaError ? (
            <p className="text-sm text-red-600">{schemaError}</p>
          ) : (
            <>
              <select
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value);
                  setCustomSql("");
                }}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">Select a table…</option>
                {schema.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.columns.length} columns)
                  </option>
                ))}
              </select>
              <div className="text-sm text-zinc-500">or</div>
              <div>
                <textarea
                  value={customSql}
                  onChange={(e) => {
                    setCustomSql(e.target.value);
                    if (selectedTable) setSelectedTable("");
                  }}
                  placeholder="Custom SQL (e.g. SELECT id, name FROM users)"
                  rows={2}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={loadVariablesFromSql}
                  disabled={!customSql.trim()}
                  isLoading={loadingColumns}
                >
                  Get variables from SQL
                </Button>
              </div>
            </>
          )}
          {columns.length > 0 && (
            <p className="text-sm text-zinc-600">
              {columns.length} variable{columns.length !== 1 ? "s" : ""}. Drag them into drop zones below.
            </p>
          )}
          {columnsError && <p className="text-sm text-red-600">{columnsError}</p>}
        </div>

        {/* 2. Chart type + drag-drop + customize */}
        {columns.length > 0 && (
          <div className="border-t border-zinc-200 pt-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              2. Chart type, variables & customize
            </label>
            <VisualizationBuilder
              columns={columns}
              chartType={chartType}
              onChartTypeChange={setChartType}
              mapping={mapping}
              onMappingChange={setMapping}
              chartOptions={chartOptions}
              onChartOptionsChange={setChartOptions}
              name={name}
              onNameChange={setName}
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!canSave}
          isLoading={saving}
        >
          Create visualization
        </Button>
      </div>
    </Modal>
  );
}
