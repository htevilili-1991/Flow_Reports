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
  Badge,
} from "@/components/ui";

interface DataSourceItem {
  id: number;
  name: string;
  db_type: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const DB_LABELS: Record<string, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
};

export default function DataSourcesPage() {
  const [list, setList] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/data-sources/")
      .then((r) => (r.ok ? r.json() : []))
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Data sources"
        description="Connect PostgreSQL, MySQL, or SQLite databases. Test connections before saving."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Data sources" },
        ]}
        actions={
          <Link href="/dashboard/data-sources/new">
            <Button variant="primary" size="md">
              Add data source
            </Button>
          </Link>
        }
      />
      {loading ? (
        <LoadingOverlay message="Loading data sources…" />
      ) : list.length === 0 ? (
        <EmptyState
          title="No data sources yet"
          description="Add a database connection to use with your questions and reports."
          action={{ label: "Add data source", href: "/dashboard/data-sources/new" }}
        />
      ) : (
        <div className="space-y-3">
          {list.map((ds) => (
            <Card key={ds.id}>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{ds.name}</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    <Badge variant="default">{DB_LABELS[ds.db_type] || ds.db_type}</Badge>
                    {ds.db_type !== "sqlite" && ds.config && (
                      <span className="ml-2">
                        {(ds.config as Record<string, string>).host || "—"} / {(ds.config as Record<string, string>).database || "—"}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Updated {new Date(ds.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/data-sources/${ds.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
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
