"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Welcome to Flow Reports. Use the sidebar to navigate. Phase 1 (auth + RBAC) is in place.
      </p>
      <DashboardWelcome />
    </div>
  );
}

function DashboardWelcome() {
  const { user } = useAuth();
  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="font-medium text-zinc-900">Your profile</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Logged in as <strong>{user?.username}</strong>
        {user?.role && (
          <> with role <strong>{user.role.name}</strong></>
        )}.
      </p>
      {user?.permissions && user.permissions.length > 0 && (
        <p className="mt-2 text-xs text-zinc-500">
          Permissions: {user.permissions.join(", ")}
        </p>
      )}
    </div>
  );
}
