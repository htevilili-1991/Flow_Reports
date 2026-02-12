"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiUrl,
  authFetch,
  clearStoredTokens,
  getStoredAccessToken,
  setStoredTokens,
} from "@/lib/api";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string, nextUrl?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const access = getStoredAccessToken();
    if (!access) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const res = await authFetch("/api/users/me/");
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      clearStoredTokens();
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (username: string, password: string, nextUrl?: string) => {
      const res = await fetch(apiUrl("/api/users/token/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          ok: false,
          error: data.detail ?? data.error ?? "Login failed",
        };
      }
      const data = await res.json();
      setStoredTokens(data.access, data.refresh);
      const meRes = await authFetch("/api/users/me/");
      if (meRes.ok) {
        setUser(await meRes.json());
        const redirect = nextUrl && nextUrl.startsWith("/") ? nextUrl : "/dashboard";
        router.push(redirect);
        return { ok: true };
      }
      clearStoredTokens();
      return { ok: false, error: "Failed to load user" };
    },
    [router]
  );

  const logout = useCallback(() => {
    clearStoredTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback(
    (code: string) => (user?.permissions ?? []).includes(code),
    [user]
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
