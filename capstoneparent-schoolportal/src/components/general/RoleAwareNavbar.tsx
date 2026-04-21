/**
 * RoleAwareNavbar
 *
 * The ONE navbar component every page should use.
 * All role-specific nav configs are defined here; no other role-specific
 * navbar files are needed.
 */

import { useAuthStore } from "@/lib/store/authStore";
import type { UserRole } from "@/lib/store/authStore";
import { AuthenticatedNavbar } from "@/components/general/AuthenticatedNavbar";
import { Navbar } from "@/components/general/Navbar";

// ─── Per-role nav configurations ─────────────────────────────────────────────

type NavConfig = React.ComponentProps<typeof AuthenticatedNavbar>;

const LOGO_ALT = "Bayog Elementary National School Logo";

const ANNOUNCEMENT_PATHS = ["/announcements"];

const NAV_CONFIGS: Record<UserRole, NavConfig> = {
  admin: {
    announcementPath: "/announcements",
    announcementActivePaths: ANNOUNCEMENT_PATHS,
    partnershipPath: "/managepartnershipandevents",
    partnershipActivePaths: [
      "/managepartnershipandevents",
      "/admin-edit-event",
    ],
    recordsItems: [
      { label: "Manage Parent Verification", to: "/manageparentverification" },
      { label: "Manage Sections", to: "/managesections" },
      { label: "Manage Staff Accounts", to: "/managestaffaccounts" },
      { label: "Manage Students", to: "/managestudents" },
      { label: "Manage Subjects", to: "/managesubjects" },
    ],
    recordsActivePaths: [
      "/manageparentverification",
      "/managesections",
      "/managestaffaccounts",
      "/managestudents",
      "/managesubjects",
    ],
    logoAlt: LOGO_ALT,
  },

  principal: {
    announcementPath: "/announcements",
    announcementActivePaths: ANNOUNCEMENT_PATHS,
    recordsItems: [
      { label: "Manage Class Lists", to: "/manageclasslists" },
      { label: "Manage Sections", to: "/managesections" },
      { label: "Manage Students", to: "/managestudents" },
      { label: "Manage Subjects", to: "/managesubjects" },
    ],
    recordsActivePaths: [
      "/manageclasslists",
      "/managesections",
      "/managestudents",
      "/managesubjects",
    ],
    sticky: true,
    logoAlt: LOGO_ALT,
  },

  teacher: {
    announcementPath: "/announcements",
    announcementActivePaths: ANNOUNCEMENT_PATHS,
    recordsItems: [
      { label: "Class Lists", to: "/classlist" },
      { label: "Manage Parent Verification", to: "/manageparentverification" },
      { label: "Manage Students", to: "/managestudents" },
    ],
    recordsActivePaths: [
      "/classlist",
      "/manageparentverification",
      "/managestudents",
    ],
    sticky: true,
    logoAlt: LOGO_ALT,
  },

  librarian: {
    announcementPath: "/announcements",
    announcementActivePaths: ANNOUNCEMENT_PATHS,
    recordsItems: [
      { label: "Manage Books", to: "/managebooks" },
      { label: "Manage Learning Resources", to: "/managelearningresources" },
      { label: "Borrowed Resources", to: "/borrowedresources" },
      { label: "Manage Categories", to: "/managecategories" },
    ],
    recordsActivePaths: [
      "/managebooks",
      "/managelearningresources",
      "/borrowedresources",
      "/managecategories",
    ],
    logoAlt: LOGO_ALT,
  },

  staff: {
    announcementPath: "/announcements",
    announcementActivePaths: ANNOUNCEMENT_PATHS,
    recordsItems: [],
    recordsActivePaths: [],
    logoAlt: LOGO_ALT,
  },

  parent: {
    announcementPath: "/announcements",
    announcementActivePaths: ["/announcements"],
    // Parent uses a plain link instead of a Records dropdown
    customNavLink: {
      label: "Learn about your child",
      to: "/parentview",
      activePaths: [
        "/parentview",
        "/classschedule",
        "/quarterlygrades",
        "/libraryrecords",
      ],
    },
    logoAlt: LOGO_ALT,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const RoleAwareNavbar = () => {
  // Reactive: re-renders automatically when active role switches
  const role = useAuthStore((s) => s.user?.role ?? null);
  const effectiveRole: UserRole | null = role ?? getLegacyRole();

  if (!effectiveRole) return <Navbar />;

  const config = NAV_CONFIGS[effectiveRole];
  if (!config) return <Navbar />;

  return <AuthenticatedNavbar {...config} />;
};

// ─── Legacy helper (backward compat for old dummy sessions) ──────────────────

function getLegacyRole(): UserRole | null {
  try {
    const raw = localStorage.getItem("dummyAuthUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: UserRole };
    return parsed.role ?? null;
  } catch {
    return null;
  }
}
