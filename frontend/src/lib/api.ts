/**
 * Base URL for the Django API. Set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:8000).
 */
export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Build full API URL for a path (e.g. "/api/users/" -> "http://localhost:8000/api/users/").
 */
export function apiUrl(path: string): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

const ACCESS_KEY = "flow_reports_access";
const REFRESH_KEY = "flow_reports_refresh";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/**
 * Call Django API with Bearer token. On 401, tries refresh then retries once.
 * Caller should handle redirect to /login when refresh fails (e.g. in auth context).
 */
export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = apiUrl(path);
  const access = getStoredAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (access) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${access}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getStoredRefreshToken()) {
    const refreshRes = await fetch(apiUrl("/api/users/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: getStoredRefreshToken() }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setStoredTokens(data.access, data.refresh ?? getStoredRefreshToken() ?? "");
      (headers as Record<string, string>)["Authorization"] = `Bearer ${data.access}`;
      res = await fetch(url, { ...options, headers });
    } else {
      clearStoredTokens();
    }
  }
  return res;
}
