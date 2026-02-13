"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingOverlay,
  Modal,
} from "@/components/ui";
import { CreateDataSourceVisualizationModal } from "@/components/dashboard/CreateDataSourceVisualizationModal";

interface DataSourceInfo {
  id: number;
  name: string;
  db_type: string;
}

interface SavedVisualization {
  id: number;
  data_source: number;
  name: string;
  question: number | null;
  question_title: string | null;
  chart_type: string;
  column_mapping: Record<string, unknown>;
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

export default function DataSourceVisualizationsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [dataSource, setDataSource] = useState<DataSourceInfo | null>(null);
  const [list, setList] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadDataSource = useCallback(async () => {
    if (!id || isNaN(id)) return;
    const res = await authFetch(`/api/data-sources/${id}/`);
    if (!res.ok) {
      setDataSource(null);
      return;
    }
    const data = await res.json();
    setDataSource(data);
  }, [id]);

  const loadVisualizations = useCallback(async () => {
    if (!id || isNaN(id)) return;
    const res = await authFetch(`/api/data-sources/${id}/visualizations/`);
    if (!res.ok) return;
    const data = await res.json();
    setList(data);
  }, [id]);

  useEffect(() => {
    loadDataSource().then(() => setLoading(false));
  }, [loadDataSource]);

  useEffect(() => {
    if (id && !isNaN(id)) loadVisualizations();
  }, [id, loadVisualizations]);

  async function handleCreated() {
    setCreateOpen(false);
    await loadVisualizations();
  }

  if (loading || !dataSource) {
    return (
      <div>
        <PageHeader
          title="Visualizations"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Data sources", href: "/dashboard/data-sources" },
            { label: "Visualizations" },
          ]}
        />
        {loading ? (
          <LoadingOverlay message="Loading…" />
        ) : (
          <p className="text-zinc-500">
            Data source not found.{" "}
            <Link href="/dashboard/data-sources" className="underline">
              Back to data sources
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Visualizations: ${dataSource.name}`}
        description="Create and manage visualizations for this data source. Dashboards can only use visualizations from one data source."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Data sources", href: "/dashboard/data-sources" },
          { label: dataSource.name, href: `/dashboard/data-sources/${id}/edit` },
          { label: "Visualizations" },
        ]}
        actions={
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            Create visualization
          </Button>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No visualizations yet"
          description="Create a visualization (chart or table) from a saved question for this data source. Then add it to a dashboard that uses this data source."
          action={{
            label: "Create visualization",
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {list.map((viz) => (
            <Card key={viz.id}>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium text-zinc-900">{viz.name}</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {CHART_LABELS[viz.chart_type] || viz.chart_type}
                    {viz.question_title && ` · ${viz.question_title}`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Updated {new Date(viz.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/dashboards?data_source=${id}`}>
                    <Button variant="outline" size="sm">
                      Use in dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateDataSourceVisualizationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        dataSourceId={id}
        dataSourceName={dataSource.name}
        onCreated={handleCreated}
      />
    </div>
  );
}
