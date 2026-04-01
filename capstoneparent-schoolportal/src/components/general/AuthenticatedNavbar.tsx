import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AboutUsDropdown } from "@/components/general/AboutUsDropdown";
import { ProfileDropdown } from "@/components/general/ProfileDropdown";
import { RoleSwitcherDropdown } from "@/components/general/RoleSwitcherDropdown";

interface NavDropdownItem {
  label: string;
  to: string;
}

interface CustomNavLink {
  label: string;
  to: string;
  activePaths: string[];
}

interface AuthenticatedNavbarProps {
  announcementPath: string;
  announcementActivePaths: string[];
  /** Standard Records dropdown. Omit when using customNavLink instead. */
  recordsItems?: NavDropdownItem[];
  recordsActivePaths?: string[];
  /** Replaces the Records dropdown with a plain link (e.g. parent role). */
  customNavLink?: CustomNavLink;
  sticky?: boolean;
  logoAlt?: string;
}

export const AuthenticatedNavbar = ({
  announcementPath,
  announcementActivePaths,
  recordsItems,
  recordsActivePaths = [],
  customNavLink,
  sticky = false,
  logoAlt = "Pagsabungan Elementary School Logo",
}: AuthenticatedNavbarProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const isAnnouncementRoute = announcementActivePaths.includes(
    location.pathname,
  );
  const isRecordsRoute = recordsActivePaths.includes(location.pathname);
  const isPartnershipRoute = location.pathname.startsWith(
    "/partnership&events",
  );
  const isCustomNavActive =
    customNavLink?.activePaths.some((p) => location.pathname.startsWith(p)) ??
    false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`bg-(--navbar-bg) px-6 py-4 ${sticky ? "sticky top-0 z-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-8">
          <Link
            to="/homepage"
            className="relative h-16 w-16 cursor-pointer transition-opacity hover:opacity-80"
          >
            <img src="/Logo.png" alt={logoAlt} className="object-contain" />
          </Link>

          <nav
            ref={navRef}
            className="flex flex-col items-center gap-4 text-center md:flex-row md:gap-20 md:text-left"
          >
            {/* About Us */}
            <div className="relative">
              <button
                type="button"
                className={`cursor-pointer text-gray-900 transition-colors hover:text-gray-700 ${
                  openDropdown === "about"
                    ? "text-xl font-bold"
                    : "text-lg font-medium"
                }`}
                onClick={() =>
                  setOpenDropdown(openDropdown === "about" ? null : "about")
                }
                aria-expanded={openDropdown === "about"}
              >
                About Us
              </button>
              {openDropdown === "about" && <AboutUsDropdown />}
            </div>

            {/* Announcements */}
            <Link
              className={`cursor-pointer text-gray-900 transition-colors hover:text-gray-700 ${
                isAnnouncementRoute
                  ? "text-xl font-bold"
                  : "text-lg font-medium"
              }`}
              to={announcementPath}
            >
              Announcements
            </Link>

            {/* Partnership & Events */}
            <Link
              to="/partnership&events"
              className={`text-gray-900 transition-colors hover:text-gray-700 ${
                isPartnershipRoute ? "text-xl font-bold" : "text-lg font-medium"
              }`}
            >
              Partnership & Events
            </Link>

            {/* 4th item: Records dropdown OR a custom plain link */}
            {customNavLink ? (
              <Link
                to={customNavLink.to}
                className={`cursor-pointer text-gray-900 transition-colors hover:text-gray-700 ${
                  isCustomNavActive
                    ? "text-xl font-bold"
                    : "text-lg font-medium"
                }`}
              >
                {customNavLink.label}
              </Link>
            ) : recordsItems && recordsItems.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  className={`cursor-pointer text-gray-900 transition-colors hover:text-gray-700 ${
                    openDropdown === "records" || isRecordsRoute
                      ? "text-xl font-bold"
                      : "text-lg font-medium"
                  }`}
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "records" ? null : "records",
                    )
                  }
                  aria-expanded={openDropdown === "records"}
                >
                  Records
                </button>

                {openDropdown === "records" && (
                  <div className="absolute z-10 mt-2 w-56 rounded-md border border-gray-200 bg-(--navbar-bg) shadow-lg">
                    {recordsItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </nav>
        </div>

        {/* Right: role switcher + profile */}
        <div className="flex items-center gap-3">
          <RoleSwitcherDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};
