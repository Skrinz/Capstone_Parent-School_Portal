export type UserRole = "admin" | "teacher" | "librarian" | "parent" | "staff";

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  userId?: number;
}

const AUTH_STORAGE_KEY = "authUser";
const JWT_STORAGE_KEY = "authToken";
const DEVICE_TOKEN_KEY = "deviceToken";

const VALID_USER_ROLES: UserRole[] = [
  "admin",
  "teacher",
  "librarian",
  "parent",
  "staff",
];

// ─── Role mapping ─────────────────────────────────────────────────────────────
// Backend roles → frontend roles
const BACKEND_TO_FRONTEND_ROLE: Record<string, UserRole> = {
  admin: "admin",
  principal: "admin",
  vice_principal: "admin",
  teacher: "teacher",
  librarian: "librarian",
  parent: "parent",
  staff: "staff",
};

/**
 * Map a backend role string (case-insensitive) to a frontend UserRole.
 * Falls back to "staff" for unknown roles.
 */
export const mapBackendRole = (backendRole: string): UserRole => {
  const key = backendRole.toLowerCase();
  return BACKEND_TO_FRONTEND_ROLE[key] ?? "staff";
};

// ─── Auth user ────────────────────────────────────────────────────────────────

export const setAuthUser = (user: AuthUser): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthUser = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(JWT_STORAGE_KEY);
  // NOTE: device token is intentionally kept so the next login skips OTP.
};

export const getAuthUser = (): AuthUser | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    const normalizedRole = String(parsed.role ?? "").toLowerCase();
    if (
      !parsed.email ||
      !parsed.name ||
      !VALID_USER_ROLES.includes(normalizedRole as UserRole)
    ) {
      return null;
    }
    return {
      email: parsed.email,
      name: parsed.name,
      role: normalizedRole as UserRole,
      userId: parsed.userId,
    };
  } catch {
    return null;
  }
};

// ─── JWT ──────────────────────────────────────────────────────────────────────

export const setJwt = (token: string): void => {
  localStorage.setItem(JWT_STORAGE_KEY, token);
};

export const getJwt = (): string | null => {
  return localStorage.getItem(JWT_STORAGE_KEY);
};

// ─── Device token ─────────────────────────────────────────────────────────────

export const setDeviceToken = (token: string): void => {
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
};

export const getDeviceToken = (): string | null => {
  return localStorage.getItem(DEVICE_TOKEN_KEY);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const isAuthenticated = (): boolean => Boolean(getAuthUser());

export const hasAllowedRole = (
  user: AuthUser | null,
  allowedRoles?: UserRole[],
): boolean => {
  if (!user) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
};

export const getDefaultRouteForRole = (role: UserRole): string => {
  switch (role) {
    case "parent":
      return "/parentview";
    case "admin":
      return "/adminview";
    case "teacher":
      return "/teacherview";
    case "librarian":
      return "/librarianview";
    case "staff":
      return "/staffview";
    default:
      return "/login";
  }
};
