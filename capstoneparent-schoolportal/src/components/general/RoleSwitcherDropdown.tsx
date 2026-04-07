import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { useAuthStore, type UserRole } from "@/lib/store/authStore";
import { getDefaultRouteForRole } from "@/lib/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  principal: "Principal",
  vice_principal: "Vice Principal",
  teacher: "Teacher",
  librarian: "Librarian",
  parent: "Parent",
  staff: "Staff",
};

const formatRoleViewLabel = (role: UserRole) => `${ROLE_LABELS[role]}'s View`;

export const RoleSwitcherDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const switchRole = useAuthStore((s) => s.switchRole);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Only show when the user has more than one role
  if (!user || !user.roles || user.roles.length <= 1) return null;

  const currentRole = user.role;

  const handleSwitch = (role: UserRole) => {
    if (role === currentRole) {
      setIsOpen(false);
      return;
    }
    switchRole(role);
    setIsOpen(false);
    navigate(getDefaultRouteForRole(role));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-0.5 rounded-full px-1.5 py-1 text-base font-medium text-black transition-opacity duration-200 hover:opacity-75"
        aria-label="Switch role"
        aria-expanded={isOpen}
      >
        <span className="hidden whitespace-nowrap sm:inline">
          {formatRoleViewLabel(currentRole)}
        </span>
        <ChevronDown
          className={`h-5 w-5 stroke-[2.5] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Switch View
            </p>
          </div>
          <div className="py-1">
            {user.roles.map((role) => {
              const isActive = role === currentRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSwitch(role)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150 ${isActive ? "bg-gray-50 font-semibold text-gray-900" : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <span className="flex-1">{formatRoleViewLabel(role)}</span>
                  {isActive && (
                    <Check className="h-4 w-4 flex-shrink-0 text-gray-500" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-xs text-gray-400">
              You have {user.roles.length} roles
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
