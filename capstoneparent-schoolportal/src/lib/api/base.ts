/**
 * src/lib/api/base.ts
 * Core fetch wrapper shared by every API module.
 */

export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Turns stored photo paths into usable image URLs. Absolute http(s), blob:,
 * and data: URLs are unchanged. Relative paths are prefixed with the API host
 * (trailing `/api` stripped from `BASE_URL`).
 */
export function resolveMediaUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }
  const origin = BASE_URL.replace(/\/api\/?$/i, "");
  return trimmed.startsWith("/") ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
}

/**
 * Reads the JWT from the Zustand-persisted localStorage entry.
 * Used by authenticated endpoints as a Bearer token fallback alongside the
 * httpOnly cookie (cookie is preferred for browser; header covers Postman / mobile).
 */
export function bearerHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem("auth-session");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    const token = parsed?.state?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Wraps fetch with base URL, cookie credentials, and unified error handling.
 * Throws an Error whose `.message` is the backend `message` field so
 * components can display it directly.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return data as T;
}
