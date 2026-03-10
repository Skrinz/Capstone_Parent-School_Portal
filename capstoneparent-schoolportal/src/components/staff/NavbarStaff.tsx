import { useState, useRef, useEffect } from "react";
import { AboutUsDropdown } from "../general/AboutUsDropdown";
import { ProfileDropdown } from "../general/ProfileDropdown";
// include records dropdown for staff (don't kow what to include yet)
import { useLocation, Link } from "react-router-dom";
import { RecordsDropdown } from "./RecordsDropdown";

export const NavbarStaff = () => {  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const isRecordsRoute = [
    "/staffview",
    "/generalannouncement",
    "/staffannouncement",
    "/memorandumannouncement",
  ].includes(location.pathname);
  const isStaffAnnouncementPage = [
    "/generalannouncement",
    "/staffannouncement",
    "/memorandumannouncement",
  ].includes(location.pathname);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-(--navbar-bg) px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="relative h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/Logo.png"
              alt="Bayog Elementary National School Logo"
              className="object-contain"
            />
          </Link>
          <nav
            ref={navRef}
            className="flex flex-col md:flex-row items-center gap-4 md:gap-20 text-center md:text-left"
          >
            <div className="relative">
              <a
                className={`text-gray-900 hover:text-gray-700 transition-colors cursor-pointer ${
                  openDropdown === "about"
                    ? "text-xl font-bold"
                    : "text-lg font-medium"
                }`}
                onClick={() =>
                  setOpenDropdown(openDropdown === "about" ? null : "about")
                }
              >
                About Us
              </a>
              {openDropdown === "about" && <AboutUsDropdown />}
            </div>
            <div className="relative">
              <Link
                to="/generalannouncement"
                className={`text-gray-900 hover:text-gray-700 transition-colors cursor-pointer ${
                  isStaffAnnouncementPage
                    ? "text-xl font-bold"
                    : "text-lg font-medium"
                }`}
              >
                Announcements
              </Link>
            </div>
            <Link
              to="/partnership&events"
              className={`text-gray-900 hover:text-gray-700 transition-colors ${
                location.pathname === "/partnership&events"
                  ? "text-xl font-bold"
                  : "text-lg font-medium"
              }`}
            >
              Partnership & Events
            </Link>
            <div className="relative">
              <a
                className={`text-gray-900 hover:text-gray-700 transition-colors cursor-pointer ${
                  openDropdown === "records" || isRecordsRoute
                    ? "text-xl font-bold"
                    : "text-lg font-medium"
                }`}
                onClick={() =>
                  setOpenDropdown(openDropdown === "records" ? null : "records")
                }
              >
                Records
              </a>
              {openDropdown === "records" && <RecordsDropdown/>}
            </div>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};