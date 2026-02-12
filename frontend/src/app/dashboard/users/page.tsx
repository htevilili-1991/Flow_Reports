"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api";
import { PageHeader, Alert, DataTable, Badge } from "@/components/ui";

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  role: { id: number; name: string } | null;
}

export default function DashboardUsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const canManage = hasPermission("users.edit") || hasPermission("users.manage");

  useEffect(() => {
    async function load() {
      const [usersRes, rolesRes] = await Promise.all([
        authFetch("/api/users/users/"),
        authFetch("/api/users/roles/"),
      ]);
      if (usersRes.status === 403) {
        setError("You don’t have permission to view users.");
        setLoading(false);
        return;
      }
      if (!usersRes.ok || !rolesRes.ok) {
        setError("Failed to load data.");
        setLoading(false);
        return;
      }
      setUsers(await usersRes.json());
      setRoles(await rolesRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function updateRole(userId: number, roleId: number) {
    setUpdatingId(userId);
    const res = await authFetch(`/api/users/users/${userId}/role/`, {
      method: "PATCH",
      body: JSON.stringify({ role_id: roleId }),
    });
    setUpdatingId(null);
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    }
  }

  if (!hasPermission("users.view") && !hasPermission("users.edit")) {
    return (
      <div>
        <PageHeader
          title="Users"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }]}
        />
        <Alert variant="error" title="Access denied">
          You don’t have permission to view this page.
        </Alert>
      </div>
    );
  }

  const columns = [
    { key: "username", header: "Username" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row: UserRow) =>
        canManage ? (
          <select
            value={row.role?.id ?? ""}
            disabled={updatingId === row.id}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) updateRole(row.id, id);
            }}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">No role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          row.role ? <Badge variant="default">{row.role.name}</Badge> : "—"
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User management"
        description="Assign roles to users. Administrator-only."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users" },
        ]}
      />
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}
      <DataTable<UserRow>
        columns={columns}
        data={users}
        keyExtractor={(row) => row.id}
        emptyMessage="No users yet."
        loading={loading}
      />
    </div>
  );
}
