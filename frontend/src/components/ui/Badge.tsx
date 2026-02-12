import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-zinc-100 text-zinc-700 border-zinc-200",
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200",
  error:
    "bg-red-50 text-red-700 border-red-200",
  info:
    "bg-blue-50 text-blue-700 border-blue-200",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
