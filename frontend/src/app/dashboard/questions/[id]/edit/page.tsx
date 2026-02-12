"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  LoadingOverlay,
} from "@/components/ui";

interface SavedQuestion {
  id: number;
  title: string;
  natural_language: string;
  generated_sql: string;
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { hasPermission } = useAuth();
  const [question, setQuestion] = useState<SavedQuestion | null>(null);
  const [title, setTitle] = useState("");
  const [naturalLanguage, setNaturalLanguage] = useState("");
  const [generatedSql, setGeneratedSql] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canEdit = hasPermission("reports.edit");

  useEffect(() => {
    if (!id || isNaN(id)) return;
    authFetch(`/api/questions/${id}/`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((q) => {
        setQuestion(q);
        setTitle(q.title);
        setNaturalLanguage(q.natural_language);
        setGeneratedSql(q.generated_sql || "");
      })
      .catch(() => setQuestion(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGenerateSql() {
    if (!naturalLanguage.trim()) {
      setError("Enter a question first.");
      return;
    }
    setError("");
    setGenerating(true);
    const res = await authFetch("/api/questions/generate-sql/", {
      method: "POST",
      body: JSON.stringify({
        natural_language: naturalLanguage.trim(),
        question_id: id,
      }),
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
    if (!id || !question) return;
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await authFetch(`/api/questions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        title: title.trim(),
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
    router.push(`/dashboard/questions/${id}/run`);
  }

  if (!canEdit) {
    return (
      <div>
        <PageHeader
          title="Edit question"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Questions", href: "/dashboard/questions" },
            { label: "Edit" },
          ]}
        />
        <Alert variant="error">You don’t have permission to edit questions.</Alert>
      </div>
    );
  }

  if (loading || !question) {
    return (
      <div>
        <PageHeader
          title="Edit question"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Questions", href: "/dashboard/questions" },
            { label: "Edit" },
          ]}
        />
        {loading ? (
          <LoadingOverlay message="Loading…" />
        ) : (
          <Alert variant="error">
            Question not found.{" "}
            <Link href="/dashboard/questions" className="underline">
              Back to list
            </Link>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit: ${question.title}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Questions", href: "/dashboard/questions" },
          { label: "Edit" },
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
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Natural language question
            </label>
            <textarea
              value={naturalLanguage}
              onChange={(e) => setNaturalLanguage(e.target.value)}
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
            <Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
              Save & run
            </Button>
            <Link href={`/dashboard/questions/${id}/run`}>
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
