"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  PageHeader,
  Button,
  Alert,
} from "@/components/ui";
import { FilterBar } from "@/components/dashboard/FilterBar";
import {
  AddSavedVisualizationModal,
  type SavedVisualizationItem,
} from "@/components/dashboard/AddSavedVisualizationModal";
import type { ChartType } from "@/components/dashboard/AddVisualizationModal";

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface DashboardData {
  id: number;
  name: string;
  data_source: number | null;
  data_source_name: string | null;
  layout: { lg?: LayoutItem[] };
  widgets: Record<string, WidgetConfig>;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ColumnMapping {
  x?: string;
  y?: string;
  series?: string;
  label?: string;
  value?: string;
  tableColumns?: string[];
}

interface ChartOptions {
  title?: string;
  x_axis_label?: string;
  y_axis_label?: string;
  show_legend?: boolean;
}

interface WidgetConfig {
  type: string;
  title?: string;
  questionId?: number;
  dataSourceId?: number;
  tableName?: string;
  sql?: string;
  chartType?: string;
  columnMapping?: ColumnMapping;
  chartOptions?: ChartOptions;
  data?: unknown[];
}

export default function DashboardBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [widgets, setWidgets] = useState<Record<string, WidgetConfig>>({});
  const [filterState, setFilterState] = useState<{ dateRange?: { start: string; end: string }; selects?: Record<string, string[]> }>({});
  const [vizModalOpen, setVizModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!id || isNaN(id)) return;
    const res = await authFetch(`/api/dashboards/${id}/`);
    if (!res.ok) {
      setDashboard(null);
      return;
    }
    const data = await res.json();
    setDashboard(data);
    setLayout(Array.isArray(data.layout?.lg) ? data.layout.lg : data.layout?.lg ?? []);
    setWidgets(data.widgets || {});
  }, [id]);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  async function handleSaveLayout() {
    if (!id || !dashboard) return;
    setSaving(true);
    setError("");
    const res = await authFetch(`/api/dashboards/${id}/layout/`, {
      method: "PATCH",
      body: JSON.stringify({ layout: { lg: layout }, widgets }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || data.layout?.[0] || "Failed to save.");
      return;
    }
    const updated = await res.json();
    setDashboard(updated);
  }

  async function handleRefreshData() {
    if (!dashboard?.data_source) return;
    setRefreshing(true);
    setError("");
    try {
      const res = await authFetch(`/api/data-sources/${dashboard.data_source}/refresh-cache/`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Refresh failed.");
        return;
      }
      setRefreshKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  }

  function addSavedVisualization(viz: SavedVisualizationItem) {
    const hasData = viz.table_name || viz.sql || viz.question != null;
    if (!hasData) return;
    const newId = `w-${Date.now()}`;
    const newItem: LayoutItem = {
      i: newId,
      x: (layout.length * 2) % 12,
      y: layout.length + 12,
      w: 4,
      h: 2,
    };
    setLayout([...layout, newItem]);
    const widget: WidgetConfig = {
      type: "chart",
      title: viz.chart_options?.title ?? viz.name,
      chartType: viz.chart_type as ChartType,
      columnMapping: (viz.column_mapping || {}) as ColumnMapping,
      chartOptions: viz.chart_options,
      data: [],
    };
    if (viz.table_name) {
      widget.dataSourceId = viz.data_source;
      widget.tableName = viz.table_name;
    } else if (viz.sql) {
      widget.dataSourceId = viz.data_source;
      widget.sql = viz.sql;
    } else if (viz.question != null) {
      widget.questionId = viz.question;
    }
    setWidgets({ ...widgets, [newId]: widget });
    setVizModalOpen(false);
  }

  if (loading || !dashboard) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Dashboards", href: "/dashboard/dashboards" },
            { label: id ? "Edit" : "New" },
          ]}
        />
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          <Alert variant="error">
            Dashboard not found. <Link href="/dashboard/dashboards">Back to list</Link>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={dashboard.name}
        description={
          dashboard.data_source_name
            ? `Data source: ${dashboard.data_source_name}. Drag to resize. Save layout to persist.`
            : "This dashboard has no data source. Create a new dashboard and select a data source to add visualizations."
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboards", href: "/dashboard/dashboards" },
          { label: dashboard.name },
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRefreshData}
              disabled={!dashboard.data_source || refreshing}
              isLoading={refreshing}
            >
              Refresh data
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setVizModalOpen(true)}
              disabled={!dashboard.data_source}
            >
              Add visualization
            </Button>
            <Button variant="primary" size="md" onClick={handleSaveLayout} isLoading={saving}>
              Save layout
            </Button>
            <Link href="/dashboard/dashboards">
              <Button variant="outline" size="md">Back</Button>
            </Link>
          </>
        }
      />
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {dashboard.data_source == null && (
        <Alert variant="error" className="mb-4">
          This dashboard has no data source. You can only add visualizations from a data source.{" "}
          <Link href="/dashboard/dashboards/new" className="underline">
            Create a new dashboard
          </Link>{" "}
          and select a data source, then create visualizations under Data sources → [source] → Visualizations.
        </Alert>
      )}

      <FilterBar
        dateRange={filterState.dateRange}
        onDateRangeChange={(dateRange) => setFilterState((s) => ({ ...s, dateRange }))}
        selects={filterState.selects}
        onSelectsChange={(selects) => setFilterState((s) => ({ ...s, selects }))}
        className="mb-4"
      />

      <AddSavedVisualizationModal
        open={vizModalOpen}
        onClose={() => setVizModalOpen(false)}
        dataSourceId={dashboard.data_source}
        onAdd={addSavedVisualization}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        onLayoutChange={(_l, all) => setLayout(all.lg || [])}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={120}
        isDraggable
        isResizable
        draggableHandle=".drag-handle"
      >
        {layout.map((item) => (
          <div key={item.i} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="drag-handle cursor-move h-8 flex items-center px-2 bg-zinc-50 border-b border-zinc-100 text-xs font-medium text-zinc-500">
              {widgets[item.i]?.title || "Widget"}
            </div>
            <div className="p-2 h-[calc(100%-2rem)] min-h-[80px]">
              <WidgetContent config={widgets[item.i]} filterState={filterState} refreshKey={refreshKey} />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

function WidgetContent({
  config,
  filterState,
  refreshKey = 0,
}: {
  config?: WidgetConfig;
  filterState?: { dateRange?: { start: string; end: string }; selects?: Record<string, string[]> };
  refreshKey?: number;
}) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapping = config?.columnMapping;
  const questionId = config?.questionId;
  const dataSourceId = config?.dataSourceId;
  const tableName = config?.tableName;
  const sql = config?.sql;
  const chartType = (config?.chartType || "line") as ChartType;
  const opts = config?.chartOptions;
  const showLegend = opts?.show_legend !== false;

  useEffect(() => {
    if (dataSourceId && (tableName || sql)) {
      let cancelled = false;
      setLoading(true);
      setError("");
      const body = tableName ? { table_name: tableName } : { sql: sql! };
      authFetch(`/api/data-sources/${dataSourceId}/run-query/`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((res) => res.json())
        .then((body: { rows?: Record<string, unknown>[]; error?: string }) => {
          if (cancelled) return;
          if (body.error) {
            setError(body.error);
            setData([]);
          } else {
            setData(body.rows ?? []);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Failed to load data");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }
    if (questionId) {
      let cancelled = false;
      setLoading(true);
      setError("");
      authFetch("/api/questions/run/", {
        method: "POST",
        body: JSON.stringify({ question_id: questionId }),
      })
        .then((res) => res.json())
        .then((body: { rows?: Record<string, unknown>[]; error?: string }) => {
          if (cancelled) return;
          if (body.error) {
            setError(body.error);
            setData([]);
          } else {
            setData(body.rows ?? []);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Failed to load data");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }
    setData((config?.data as Record<string, unknown>[]) || []);
  }, [dataSourceId, tableName, sql, questionId, config?.data, refreshKey]);

  if (!config) return <div className="text-zinc-400 text-sm">No config</div>;
  if (loading) return <div className="text-zinc-500 text-sm flex items-center justify-center h-full">Loading…</div>;
  if (error) return <div className="text-red-600 text-sm p-2">{error}</div>;

  const xKey = mapping?.x ?? "x";
  const yKey = mapping?.y ?? "y";
  const seriesKey = mapping?.series;
  const labelKey = mapping?.label ?? "name";
  const valueKey = mapping?.value ?? "value";
  const chartData = data.length > 0 ? data : [
    { [xKey]: "A", [yKey]: 40 },
    { [xKey]: "B", [yKey]: 60 },
    { [xKey]: "C", [yKey]: 80 },
  ];

  if (chartType === "table") {
    const cols = (mapping?.tableColumns && mapping.tableColumns.length > 0)
      ? mapping.tableColumns
      : data.length > 0
        ? Object.keys(data[0])
        : [];
    return (
      <div className="overflow-auto h-full text-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              {cols.map((c) => (
                <th key={c} className="text-left py-1 px-2 font-medium text-zinc-700">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.length > 0 ? data : []).map((row, i) => (
              <tr key={i} className="border-b border-zinc-100">
                {cols.map((c) => (
                  <td key={c} className="py-1 px-2">{String((row as Record<string, unknown>)[c] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="text-zinc-400 p-2">No data. Run the question to see results.</p>}
      </div>
    );
  }

  if (chartType === "pie") {
    const pieData = chartData.map((r) => ({
      name: String((r as Record<string, unknown>)[labelKey] ?? ""),
      value: Number((r as Record<string, unknown>)[valueKey]) || 0,
    }));
    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={80}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            label
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={80}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} name={opts?.x_axis_label} />
          <YAxis name={opts?.y_axis_label} />
          <Tooltip />
          {showLegend && <Legend />}
          <Bar dataKey={yKey} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={80}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} name={opts?.x_axis_label} />
          <YAxis name={opts?.y_axis_label} />
          <Tooltip />
          {showLegend && <Legend />}
          <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={80}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} name={opts?.x_axis_label} />
        <YAxis name={opts?.y_axis_label} />
        <Tooltip />
        {showLegend && <Legend />}
        <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
