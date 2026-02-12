"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { IconChart, IconUsers, IconDocument } from "@/components/icons";

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const canViewUsers = hasPermission("users.view") || hasPermission("users.edit");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your Flow Reports workspace."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Stat cards - placeholder values until Phase 2+ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total users"
          value="—"
          description="Registered accounts"
          icon={<IconUsers />}
        />
        <StatCard
          title="Reports"
          value="—"
          description="Saved reports"
          icon={<IconDocument />}
        />
        <StatCard
          title="Dashboards"
          value="—"
          description="Custom dashboards"
          icon={<IconChart />}
        />
        <StatCard
          title="Data sources"
          value="—"
          description="Connected sources"
          icon={<IconDocument />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Welcome / profile card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.username}</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.role && (
              <p className="text-sm text-zinc-600">
                Role: <Badge variant="info">{user.role.name}</Badge>
              </p>
            )}
            <p className="mt-2 text-sm text-zinc-500">
              Phase 1 (auth + RBAC) is in place. Use the sidebar to open Users or
              explore templates as we add reports and dashboards.
            </p>
            <div className="mt-4 flex gap-2">
              {canViewUsers && (
                <Link href="/dashboard/users">
                  <Button variant="primary" size="sm">
                    Go to Users
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>• Create a new report (coming in Phase 2)</li>
              <li>• Build a dashboard (coming in Phase 3)</li>
              <li>• Connect a data source (coming in Phase 2)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
