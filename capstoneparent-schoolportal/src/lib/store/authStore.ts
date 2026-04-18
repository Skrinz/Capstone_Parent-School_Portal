import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "principal"
  | "teacher"
  | "librarian"
  | "parent"
  | "staff";

export interface SessionUser {
  userId: number;
  email: string;
  name: string;
  role: UserRole; // currently active role
  roles: UserRole[]; // all roles this user has
  contact_num?: string;
  address?: string;
  date_of_birth?: string;
  photo_path?: string;
}

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  deviceToken: string | null;
  isAuthenticated: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────

  loginSuccess: (
    token: string,
    apiUser: AuthUser,
    newDeviceToken?: string,
  ) => void;

  /** Clears session but preserves deviceToken so OTP is skipped next login. */
  logout: () => void;

  /** Switch active role (only to a role the user actually has). */
  switchRole: (role: UserRole) => void;

  setDeviceToken: (token: string) => void;
  clearDeviceToken: () => void;
  setUser: (user: SessionUser) => void;
  hasAcceptedPrivacy: boolean;
  acceptPrivacy: () => void;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_MAP: Record<string, UserRole> = {
  admin: "admin",
  principal: "principal",
  teacher: "teacher",
  librarian: "librarian",
  parent: "parent",
  staff: "staff",
};

/** Priority order for selecting the "default" active role. */
const ROLE_PRIORITY: UserRole[] = [
  "admin",
  "principal",
  "teacher",
  "librarian",
  "parent",
  "staff",
];

function mapRole(raw: string): UserRole {
  return ROLE_MAP[raw.toLowerCase()] ?? "staff";
}

/** Map and deduplicate all backend roles. */
function resolveAllRoles(roles: { role: string }[]): UserRole[] {
  const mapped = roles.map((r) => mapRole(r.role));
  const unique = [...new Set(mapped)];
  // Sort by priority so the list is consistent
  return unique.sort(
    (a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b),
  );
}

/** Pick the highest-priority role from the user's role list. */
function resolveDefaultRole(roles: { role: string }[]): UserRole {
  const allRoles = resolveAllRoles(roles);
  return allRoles[0] ?? "staff";
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      deviceToken: null,
      isAuthenticated: false,
      hasAcceptedPrivacy: false,

      loginSuccess(token, apiUser, newDeviceToken) {
        const allRoles = resolveAllRoles(apiUser.roles ?? []);
        const role = resolveDefaultRole(apiUser.roles ?? []);

        const sessionUser: SessionUser = {
          userId: apiUser.user_id,
          email: apiUser.email,
          name: `${apiUser.fname} ${apiUser.lname}`,
          role,
          roles: allRoles,
          contact_num: apiUser.contact_num,
          address: apiUser.address,
          date_of_birth: apiUser.date_of_birth,
          photo_path: apiUser.photo_path,
        };

        set((prev) => ({
          user: sessionUser,
          token,
          deviceToken: newDeviceToken ?? prev.deviceToken,
          isAuthenticated: true,
          hasAcceptedPrivacy: false,
        }));
      },

      logout() {
        set((prev) => ({
          user: null,
          token: null,
          isAuthenticated: false,
          deviceToken: prev.deviceToken,
          hasAcceptedPrivacy: false,
        }));
      },

      switchRole(role) {
        const { user } = get();
        if (!user) return;
        // Only allow switching to a role the user actually has
        if (!user.roles.includes(role)) return;
        set({ user: { ...user, role } });
      },

      setDeviceToken(token) {
        set({ deviceToken: token });
      },

      clearDeviceToken() {
        set({ deviceToken: null });
      },

      setUser(user) {
        set({ user });
      },

      acceptPrivacy() {
        set({ hasAcceptedPrivacy: true });
      },
    }),
    {
      name: "auth-session",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        deviceToken: state.deviceToken,
        isAuthenticated: state.isAuthenticated,
        hasAcceptedPrivacy: state.hasAcceptedPrivacy,
      }),
    },
  ),
);
