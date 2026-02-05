import { debugLog } from "./debug";

const base = typeof import.meta.env.VITE_API_URL === "string"
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "";

/** True when API is served by Supabase Edge Functions (single /api router). */
const isSupabaseFunctions =
  typeof base === "string" && base.includes("supabase.co/functions");

export function getApiUrl(): string {
  return base || "";
}

export function apiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (isSupabaseFunctions) return `${base}/api`;
  return base ? `${base}${p}` : p;
}

/** Headers for API requests (includes X-Path when using Supabase Edge). */
export function apiHeaders(path: string, token?: string | null): Record<string, string> {
  const normalized = path.startsWith("/api") ? path : `/api/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isSupabaseFunctions) headers["X-Path"] = normalized;
  return headers;
}

export interface ApiOptions extends RequestInit {
  token?: string | null;
  /** When true, 401 will not trigger global logout (e.g. for checkout). Caller should handle session-expired UX. */
  skipUnauthorizedLogout?: boolean;
}

/** Extract error message from API response body. Always returns a string, never "[object Object]". */
export function extractApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  const err = obj.error ?? obj.message;
  if (typeof err === "string" && err && err !== "[object Object]") return err;
  if (err && typeof err === "object") {
    const msg = (err as { message?: string }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  if (err != null) {
    const s = String(err);
    if (s !== "[object Object]") return s;
  }
  return fallback;
}

/** Called when API returns 401. Set by AuthContext to clear session and redirect to login. */
let onUnauthorized: (() => void) | null = null;
let unauthorizedHandled = false;
export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
  if (!cb) unauthorizedHandled = false;
}
/** Reset so the next 401 will trigger onUnauthorized again. Call when establishing a new session. */
export function resetUnauthorizedHandled(): void {
  unauthorizedHandled = false;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, skipUnauthorizedLogout, ...init } = options;
  const normalized = path.startsWith("/api") ? path : `/api/${path.replace(/^\//, "")}`;
  const pathOnly = normalized.includes("?") ? normalized.slice(0, normalized.indexOf("?")) : normalized;
  const queryString = normalized.includes("?") ? normalized.slice(normalized.indexOf("?")) : "";
  const url = apiPath(pathOnly) + queryString;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isSupabaseFunctions) headers["X-Path"] = pathOnly;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (networkError) {
    debugLog("api", "fetch failed", pathOnly, networkError);
    throw new Error(
      typeof networkError === "object" && networkError !== null && "message" in networkError
        ? String((networkError as { message: unknown }).message)
        : "Network error. Please check your connection."
    );
  }

  if (!res.ok) {
    if (res.status === 401 && !skipUnauthorizedLogout && !unauthorizedHandled) {
      unauthorizedHandled = true;
      onUnauthorized?.();
    }
    const text = await res.text();
    let err: Record<string, unknown> = { error: res.statusText };
    try {
      if (text.trim()) err = JSON.parse(text) as Record<string, unknown>;
    } catch {
      err = { error: text || res.statusText };
    }
    const message = extractApiErrorMessage(err, res.statusText);
    debugLog("api", "error response", pathOnly, res.status, message);
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const text = await res.text();
    try {
      return (text ? JSON.parse(text) : null) as T;
    } catch (parseError) {
      debugLog("api", "invalid JSON response", pathOnly, parseError);
      throw new Error("Invalid response from server.");
    }
  }
  return res.text() as Promise<T>;
}
