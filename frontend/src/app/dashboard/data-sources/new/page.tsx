"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const DB_TYPES = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
];

export default function NewDataSourcePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dbType, setDbType] = useState<"postgresql" | "mysql" | "sqlite">("postgresql");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("");
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [path, setPath] = useState("");
  const [error, setError] = useState("");
  const [testMessage, setTestMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  function getConfig() {
    if (dbType === "sqlite") {
      return { path: path.trim() || "/tmp/flow_reports.sqlite" };
    }
    return {
      host: host.trim() || "localhost",
      port: port ? parseInt(port, 10) : (dbType === "mysql" ? 3306 : 5432),
      database: database.trim(),
      user: user.trim(),
      password,
    };
  }

  async function handleTest() {
    setError("");
    setTestMessage(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setTesting(true);
    const res = await authFetch("/api/data-sources/test/", {
      method: "POST",
      body: JSON.stringify({ db_type: dbType, config: getConfig() }),
    });
    const data = await res.json().catch(() => ({}));
    setTesting(false);
    setTestMessage({
      success: data.success === true,
      text: data.message || (data.success ? "Connected." : "Connection failed."),
    });
  }

  async function handleSave() {
    setError("");
    setTestMessage(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (dbType !== "sqlite" && !database.trim()) {
      setError("Database name is required.");
      return;
    }
    setSaving(true);
    const res = await authFetch("/api/data-sources/", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), db_type: dbType, config: getConfig() }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.name?.[0] || data.config?.[0] || "Failed to save.");
      return;
    }
    router.push("/dashboard/data-sources");
  }

  return (
    <div>
      <PageHeader
        title="Add data source"
        description="Enter connection details and test before saving."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Data sources", href: "/dashboard/data-sources" },
          { label: "Add" },
        ]}
      />
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {testMessage && (
        <Alert
          variant={testMessage.success ? "success" : "error"}
          className="mb-4"
        >
          {testMessage.text}
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production DB"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Database type</label>
            <select
              value={dbType}
              onChange={(e) => setDbType(e.target.value as "postgresql" | "mysql" | "sqlite")}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {dbType === "sqlite" ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700">File path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/database.sqlite"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder={dbType === "mysql" ? "3306" : "5432"}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Database name</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">User</label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleTest}
              isLoading={testing}
            >
              Test connection
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
              Save data source
            </Button>
            <Link href="/dashboard/data-sources">
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
