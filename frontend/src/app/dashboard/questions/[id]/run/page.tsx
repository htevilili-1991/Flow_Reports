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
import { IconChart } from "@/components/icons";

interface SavedQuestion {
  id: number;
  title: string;
  natural_language: string;
  generated_sql: string;
}

export default function RunQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { hasPermission } = useAuth();
  const [question, setQuestion] = useState<SavedQuestion | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || isNaN(id)) return;
    authFetch(`/api/questions/${id}/`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setQuestion)
      .catch(() => setQuestion(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRun() {
    if (!id) return;
    setError("");
    setRunning(true);
    const res = await authFetch("/api/questions/run/", {
      method: "POST",
      body: JSON.stringify({ question_id: id }),
    });
    const data = await res.json().catch(() => ({}));
    setRunning(false);
    if (!res.ok) {
      setError(data.error || "Failed to run query.");
      setRows([]);
      return;
    }
    setRows(data.rows || []);
  }

  if (!hasPermission("reports.view")) {
    return (
      <div>
        <PageHeader
          title="Run question"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Questions", href: "/dashboard/questions" },
            { label: "Run" },
          ]}
        />
        <Alert variant="error">You don’t have permission to run questions.</Alert>
      </div>
    );
  }

  if (loading || !question) {
    return (
      <div>
        <PageHeader
          title="Run question"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Questions", href: "/dashboard/questions" },
            { label: "Run" },
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

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div>
      <PageHeader
        title={question.title}
        description="Run the generated SQL and view results."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Questions", href: "/dashboard/questions" },
          { label: question.title },
        ]}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleRun}
            isLoading={running}
          >
            Run query
          </Button>
        }
      />
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Question & SQL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-600">{question.natural_language}</p>
          {question.generated_sql ? (
            <pre className="overflow-x-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
              {question.generated_sql}
            </pre>
          ) : (
            <p className="text-sm text-zinc-500">
              No SQL yet. Edit this question and generate SQL first.
            </p>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <Card className="mb-6 overflow-hidden">
            <CardHeader>
              <CardTitle>Results ({rows.length} rows)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500"
                        >
                          {String(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900"
                          >
                            {row[col] != null ? String(row[col]) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChart />
                Chart (placeholder)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center">
                <p className="text-sm text-zinc-500">
                  Chart visualization will be available in a later phase.
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  You can use the table above for now.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {rows.length === 0 && !running && (
        <p className="text-sm text-zinc-500">
          Click &quot;Run query&quot; to see results.
        </p>
      )}
    </div>
  );
}
