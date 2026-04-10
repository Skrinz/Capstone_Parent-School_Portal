/**
 * src/lib/api/base.ts
 * Core fetch wrapper shared by every API module.
 */

import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

function normalizeApiBaseUrl(url?: string): string {
  const fallback = "/api";
  const trimmed = url?.trim();

  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * In Vite dev, default to same-origin `/api` so requests go through the dev-server
 * proxy (see vite.config.ts). Set VITE_API_URL when the API lives elsewhere.
 */
export const BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

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

interface ApiFetchOptions extends RequestInit {
  successMessage?: string;
  errorMessage?: string;
  skipSuccessFeedback?: boolean;
  skipErrorFeedback?: boolean;
}

const isMutationMethod = (method?: string) => {
  const normalizedMethod = method?.toUpperCase() ?? "GET";
  return normalizedMethod !== "GET";
};

/**
 * Wraps fetch with base URL, cookie credentials, and unified error handling.
 * Throws an Error whose `.message` is the backend `message` field so
 * components can display it directly.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    successMessage,
    errorMessage,
    skipSuccessFeedback = false,
    skipErrorFeedback = false,
    ...requestInit
  } = options;
  const isMutation = isMutationMethod(requestInit.method);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...requestInit,
    credentials: "include",
    headers: {
      ...requestInit.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const msg =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      `Request failed: ${res.status}`;

    if (isMutation && !skipErrorFeedback) {
      useApiFeedbackStore.getState().showError(errorMessage || msg);
    }

    throw new Error(msg);
  }

  if (isMutation && !skipSuccessFeedback) {
    const resolvedSuccessMessage =
      successMessage ||
      (typeof data?.message === "string" ? data.message : "");

    if (resolvedSuccessMessage) {
      useApiFeedbackStore.getState().showSuccess(resolvedSuccessMessage);
    }
  }

  return data as T;
}
