"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const nav = [
    { href: "/dashboard", label: "Home" },
    ...(hasPermission("users.view") || hasPermission("users.edit")
      ? [{ href: "/dashboard/users", label: "Users" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-56 border-r border-zinc-200 bg-white">
        <div className="flex h-14 items-center border-b border-zinc-200 px-4">
          <Link href="/dashboard" className="font-semibold text-zinc-900">
            Flow Reports
          </Link>
        </div>
        <nav className="p-2">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === href
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600">
              {user?.username}
              {user?.role && (
                <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-700">
                  {user.role.name}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
