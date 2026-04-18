/**
 * src/lib/auth.ts
 *
 * Compatibility helpers that delegate to the Zustand auth store.
 */

import { useAuthStore } from "./store/authStore";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { UserRole, SessionUser } from "./store/authStore";

// ─── JWT ──────────────────────────────────────────────────────────────────────

export function setJwt(token: string): void {
  useAuthStore.setState({ token, isAuthenticated: true });
}

export function getJwt(): string | null {
  return useAuthStore.getState().token;
}

// ─── Device token ─────────────────────────────────────────────────────────────

export function setDeviceToken(token: string, email: string): void {
  if (!token) {
    useAuthStore.getState().clearDeviceToken(email);
  } else {
    useAuthStore.getState().setDeviceToken(email, token);
  }
}

export function getDeviceToken(email: string): string | null {
  return useAuthStore.getState().deviceTokens[email.toLowerCase()] || null;
}

// ─── Session user ─────────────────────────────────────────────────────────────

import type { SessionUser } from "./store/authStore";

export function setAuthUser(user: SessionUser): void {
  // Ensure `roles` is always populated — fall back to single-role array if
  // older call-sites pass a SessionUser without it.
  const withRoles: SessionUser = {
    ...user,
    roles: user.roles?.length ? user.roles : [user.role],
  };
  useAuthStore.getState().setUser(withRoles);
}

export function getAuthUser(): SessionUser | null {
  return useAuthStore.getState().user;
}

export function clearAuthUser(): void {
  useAuthStore.getState().logout();
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

import type { UserRole } from "./store/authStore";

const ROLE_MAP: Record<string, UserRole> = {
  admin: "admin",
  principal: "principal",
  teacher: "teacher",
  librarian: "librarian",
  parent: "parent",
  staff: "staff",
};

export function mapBackendRole(backendRole: string): UserRole {
  return ROLE_MAP[backendRole.toLowerCase()] ?? "staff";
}

const DEFAULT_ROUTES: Record<UserRole, string> = {
  admin: "/homepage",
  principal: "/homepage",
  teacher: "/homepage",
  librarian: "/homepage",
  parent: "/homepage",
  staff: "/homepage",
};

export function getDefaultRouteForRole(role: UserRole): string {
  return DEFAULT_ROUTES[role] ?? "/";
}

export function hasAllowedRole(
  user: SessionUser,
  allowedRoles?: UserRole[],
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
}
