"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Alert,
} from "@/components/ui";

interface DataSourceItem {
  id: number;
  name: string;
}

export default function NewQuestionPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [dataSourceId, setDataSourceId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [naturalLanguage, setNaturalLanguage] = useState("");
  const [generatedSql, setGeneratedSql] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission("reports.edit");

  useEffect(() => {
    authFetch("/api/data-sources/")
      .then((r) => (r.ok ? r.json() : []))
      .then(setDataSources);
  }, []);

  async function handleGenerateSql() {
    if (!naturalLanguage.trim()) {
      setError("Enter a question first.");
      return;
    }
    setError("");
    setGenerating(true);
    const res = await authFetch("/api/questions/generate-sql/", {
      method: "POST",
      body: JSON.stringify({ natural_language: naturalLanguage.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setGenerating(false);
    if (!res.ok) {
      setError(data.error || "Failed to generate SQL.");
      return;
    }
    setGeneratedSql(data.generated_sql || "");
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await authFetch("/api/questions/", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        data_source: dataSourceId === "" ? null : dataSourceId,
        natural_language: naturalLanguage.trim() || " ",
        generated_sql: generatedSql,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.title?.[0] || data.natural_language?.[0] || "Failed to save.");
      return;
    }
    const saved = await res.json();
    router.push(`/dashboard/questions/${saved.id}/run`);
  }

  if (!canEdit) {
    return (
      <div>
        <PageHeader
          title="New question"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Questions", href: "/dashboard/questions" },
            { label: "New" },
          ]}
        />
        <Alert variant="error">You don’t have permission to create questions.</Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="New question"
        description="Enter a question in natural language, generate SQL, then save and run."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Questions", href: "/dashboard/questions" },
          { label: "New" },
        ]}
      />
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. List all users"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Data source</label>
            <p className="text-xs text-zinc-500 mt-0.5">
              Link this question to a data source so you can use it in visualizations for that source.
            </p>
            <select
              value={dataSourceId}
              onChange={(e) =>
                setDataSourceId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">None</option>
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Natural language question
            </label>
            <textarea
              value={naturalLanguage}
              onChange={(e) => setNaturalLanguage(e.target.value)}
              placeholder="e.g. Show me all users with their roles"
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleGenerateSql}
              isLoading={generating}
            >
              Generate SQL
            </Button>
          </div>
          {generatedSql && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Generated SQL (read-only)
              </label>
              <pre className="mt-1 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
                {generatedSql}
              </pre>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={saving}
            >
              Save & run
            </Button>
            <Link href="/dashboard/questions">
              <Button variant="outline" size="md">
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
