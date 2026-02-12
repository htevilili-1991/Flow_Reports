"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { IconHome, IconUsers, IconChevronLeft, IconChevronRight } from "@/components/icons";
import { Badge } from "@/components/ui";

const SIDEBAR_COLLAPSED_KEY = "flow_reports_sidebar_collapsed";

const SIDEBAR_LINKS: { href: string; label: string; icon: React.ReactNode; permission?: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconHome /> },
  { href: "/dashboard/users", label: "Users", icon: <IconUsers />, permission: "users.view" },
];

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }];
  let path = "/dashboard";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, href: path });
  }
  if (crumbs.length > 1) crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };
  return crumbs;
}

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
  const breadcrumbs = getBreadcrumbs(pathname ?? "/dashboard");

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    }
  };

  const nav = SIDEBAR_LINKS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-zinc-200 px-3">
          <Link
            href="/dashboard"
            className={`flex items-center font-semibold text-zinc-900 ${
              collapsed ? "justify-center w-full" : "gap-2"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              F
            </span>
            {!collapsed && <span>Flow Reports</span>}
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {nav.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                pathname === href
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {icon}
              {!collapsed && label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-2">
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center justify-center rounded-lg py-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6">
          <nav className="flex items-center gap-1 text-sm text-zinc-500">
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-300">/</span>}
                {item.href ? (
                  <Link href={item.href} className="hover:text-zinc-700 hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-zinc-700">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600">
              {user?.username}
              {user?.role && (
                <Badge variant="default" className="ml-1.5">
                  {user.role.name}
                </Badge>
              )}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
