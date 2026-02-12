"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api";

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
        <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
        <p className="mt-2 text-zinc-600">You don’t have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
        <p className="mt-2 text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">User management</h1>
      <p className="mt-1 text-zinc-600">Assign roles to users. Administrator-only.</p>
      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Role
              </th>
              {canManage && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {users.map((user) => (
              <tr key={user.id} className="bg-white">
                <td className="px-4 py-3 text-sm text-zinc-900">{user.username}</td>
                <td className="px-4 py-3 text-sm text-zinc-600">{user.email}</td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {user.role?.name ?? "—"}
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <select
                      value={user.role?.id ?? ""}
                      disabled={updatingId === user.id}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (id) updateRole(user.id, id);
                      }}
                      className="rounded border border-zinc-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">No role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
