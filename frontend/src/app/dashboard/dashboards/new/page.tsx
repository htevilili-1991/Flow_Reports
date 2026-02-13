"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { PageHeader, Button, Alert, LoadingSpinner } from "@/components/ui";

interface DataSourceItem {
  id: number;
  name: string;
}

export default function NewDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("Untitled Dashboard");
  const [dataSourceId, setDataSourceId] = useState<number | "">("");
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch("/api/data-sources/")
      .then((r) => (r.ok ? r.json() : []))
      .then(setDataSources)
      .finally(() => setLoadingSources(false));
  }, []);

  function formatApiError(
    statusCode: number,
    data: Record<string, unknown>,
    rawText?: string
  ): string {
    if (typeof data.detail === "string") {
      const extra = typeof data.error === "string" ? ` — ${data.error}` : "";
      return `[${statusCode}] ${data.detail}${extra}`;
    }
    if (Array.isArray(data.detail))
      return `[${statusCode}] ${(data.detail as string[]).join(" ")}`;
    if (typeof data.error === "string")
      return `[${statusCode}] ${data.error}`;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (k === "detail") continue;
      const msg =
        typeof v === "object" && v !== null && !Array.isArray(v)
          ? JSON.stringify(v)
          : Array.isArray(v)
            ? (v as string[]).join(", ")
            : String(v);
      if (msg) parts.push(`${k}: ${msg}`);
    }
    if (parts.length) return `[${statusCode}] ${parts.join("; ")}`;
    if (rawText && rawText.length < 500) return `[${statusCode}] ${rawText}`;
    return `Failed to create (${statusCode}). Check console for response.`;
  }

  async function handleCreate() {
    setError("");
    setSaving(true);
    try {
      if (dataSourceId === "" || dataSources.length === 0) {
        setError("Select a data source. Dashboards use visualizations from one data source only.");
        return;
      }
      const res = await authFetch("/api/dashboards/", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim() || "Untitled Dashboard",
          data_source: dataSourceId,
          layout: { lg: [] },
          widgets: {},
        }),
      });
      const rawText = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (rawText) data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        // non-JSON response (e.g. HTML error page)
      }
      if (!res.ok) {
        setError(
          formatApiError(
            res.status,
            data,
            rawText
          )
        );
        return;
      }
      const id = data.id as number | undefined;
      if (id != null) router.push(`/dashboard/dashboards/${id}`);
      else setError("Created but no ID returned.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network or parse error.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New dashboard"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboards", href: "/dashboard/dashboards" },
          { label: "New" },
        ]}
      />
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Data source <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-zinc-500 mt-0.5">
            This dashboard will only show visualizations from the selected data source.
          </p>
          {loadingSources ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
              <LoadingSpinner /> Loading…
            </div>
          ) : (
            <select
              value={dataSourceId}
              onChange={(e) =>
                setDataSourceId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="">Select a data source…</option>
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          )}
          {!loadingSources && dataSources.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">
              No data sources yet. <Link href="/dashboard/data-sources/new" className="underline">Add one</Link> first, then create visualizations for it.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={saving}
            disabled={loadingSources || dataSources.length === 0 || dataSourceId === ""}
          >
            Create & open builder
          </Button>
          <Link href="/dashboard/dashboards">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
