import React from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<AlertVariant, string> = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: AlertVariant;
  title?: string;
}

export function Alert({
  children,
  variant = "info",
  title,
  className = "",
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {title && (
        <p className="mb-1 font-semibold">{title}</p>
      )}
      <div className="text-sm">{children}</div>
    </div>
  );
}
