export type UserRole = "admin" | "teacher" | "librarian" | "parent" | "staff";

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

const AUTH_STORAGE_KEY = "dummyAuthUser";
const VALID_USER_ROLES: UserRole[] = [
  "admin",
  "teacher",
  "librarian",
  "parent",
  "staff",
];

export const setAuthUser = (user: AuthUser): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthUser = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getAuthUser = (): AuthUser | null => {
  const rawAuthUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawAuthUser) return null;

  try {
    const parsedUser = JSON.parse(rawAuthUser) as Partial<AuthUser>;
    const normalizedRole = String(parsedUser.role ?? "").toLowerCase();
    if (
      !parsedUser ||
      !parsedUser.email ||
      !parsedUser.name ||
      !VALID_USER_ROLES.includes(normalizedRole as UserRole)
    ) {
      return null;
    }

    return {
      email: parsedUser.email,
      name: parsedUser.name,
      role: normalizedRole as UserRole,
    };
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => Boolean(getAuthUser());

export const hasAllowedRole = (
  user: AuthUser | null,
  allowedRoles?: UserRole[]
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
