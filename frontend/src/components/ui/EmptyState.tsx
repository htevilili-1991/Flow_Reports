import React from "react";
import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary" size="md">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
