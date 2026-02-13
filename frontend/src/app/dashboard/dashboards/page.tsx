"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  EmptyState,
  LoadingOverlay,
} from "@/components/ui";

interface DashboardItem {
  id: number;
  name: string;
  layout: Record<string, unknown>;
  widgets: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function DashboardsListPage() {
  const [list, setList] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/dashboards/")
      .then((r) => (r.ok ? r.json() : []))
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboards"
        description="Build and manage dashboards with charts and filters."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboards" },
        ]}
        actions={
          <Link href="/dashboard/dashboards/new">
            <Button variant="primary" size="md">
              New dashboard
            </Button>
          </Link>
        }
      />
      {loading ? (
        <LoadingOverlay message="Loading dashboards…" />
      ) : list.length === 0 ? (
        <EmptyState
          title="No dashboards yet"
          description="Create a dashboard and add charts, tables, and filters."
          action={{ label: "New dashboard", href: "/dashboard/dashboards/new" }}
        />
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{d.name}</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Updated {new Date(d.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/dashboards/${d.id}`}>
                    <Button variant="primary" size="sm">
                      Open
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
