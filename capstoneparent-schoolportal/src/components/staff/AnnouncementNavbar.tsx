import { useRef } from "react";
import { useLocation, Link } from "react-router-dom";

export const AnnouncementNavbar = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  // Helper to determine if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <nav
          ref={navRef}
          className="flex flex-row justify-center items-center gap-12"
        >
          <NavItem
            to="/generalannouncement"
            label="General"
            active={isActive("/announcements") || isActive("/generalannouncement")}
          />
          <NavItem to="/staffannouncement" label="Staffs" active={isActive("/staffannouncement")} />
          <NavItem to="/memorandumannouncement" label="Memorandum" active={isActive("/memorandumannouncement")} />
        </nav>
      </div>
    </header>
  );
};

// Sub-component for cleaner code
const NavItem = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`relative py-4 text-sm tracking-widest uppercase transition-all duration-200 ${
      active 
        ? "text-gray-900 font-bold" 
        : "text-gray-500 font-medium hover:text-gray-700"
    }`}
  >
    {label}
    {/* The Active Indicator Line */}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-gray-900 rounded-t-md" />
    )}
  </Link>
);