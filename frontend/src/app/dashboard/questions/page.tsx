"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api";
import { PageHeader, Card, CardContent, Button, EmptyState, LoadingOverlay } from "@/components/ui";

interface SavedQuestionItem {
  id: number;
  title: string;
  natural_language: string;
  created_at: string;
  updated_at: string;
}

export default function QuestionsPage() {
  const { hasPermission } = useAuth();
  const [list, setList] = useState<SavedQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/questions/")
      .then((r) => (r.ok ? r.json() : []))
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  const canEdit = hasPermission("reports.edit");

  return (
    <div>
      <PageHeader
        title="Saved questions"
        description="Natural language questions and generated SQL. Run to see results."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Questions" },
        ]}
        actions={
          canEdit ? (
            <Link href="/dashboard/questions/new">
              <Button variant="primary" size="md">
                New question
              </Button>
            </Link>
          ) : null
        }
      />
      {loading ? (
        <LoadingOverlay message="Loading questions…" />
      ) : list.length === 0 ? (
        <EmptyState
          title="No saved questions yet"
          description="Create a question in natural language, generate SQL, and run it to see results."
          action={
            canEdit
              ? { label: "New question", href: "/dashboard/questions/new" }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((q) => (
            <Card key={q.id}>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{q.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {q.natural_language}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Updated {new Date(q.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/questions/${q.id}/run`}>
                    <Button variant="primary" size="sm">
                      Run
                    </Button>
                  </Link>
                  {canEdit && (
                    <Link href={`/dashboard/questions/${q.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
