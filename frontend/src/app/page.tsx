"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) router.replace("/dashboard");
    else router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-zinc-500">Redirecting…</p>
        <p className="mt-2 text-sm text-zinc-400">
          If you are not redirected, <Link href="/login" className="text-blue-600 hover:underline">go to login</Link>.
        </p>
      </div>
    </div>
  );
}
