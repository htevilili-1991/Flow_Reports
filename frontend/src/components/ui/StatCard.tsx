import React from "react";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className = "",
}: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend.positive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
