import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-2",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-zinc-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
}

export function LoadingOverlay({
  message = "Loading…",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-zinc-50/80 py-12">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm text-zinc-500">{message}</p>
      )}
    </div>
  );
}
