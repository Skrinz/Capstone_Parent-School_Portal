import { Button } from "@/components/ui/button";
import { NavbarMenu, type NavbarMenuItem } from "@/components/general/NavbarMenu";
import { useState, useRef, useEffect } from "react"
import { AboutUsDropdown } from "./AboutUsDropdown";
import { useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/lib/store/authStore";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const { isAuthenticated } = useAuthStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isRegisterPage = location.pathname === "/register";
  const isPartnershipAndEventsRoute = location.pathname.startsWith("/partnership&events");
  const aboutRoutes = [
    "/contactus",
    "/history",
    "/organizationalchart",
    "/schoolcalendar",
    "/transparency",
    "/visionandmission",
  ];
  const isAboutSelected = aboutRoutes.includes(location.pathname);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems: NavbarMenuItem[] = [
    {
      key: "about",
      label: "About Us",
      type: "dropdown",
      isActive: isAboutSelected || openDropdown === "about",
      onClick: () => setOpenDropdown(openDropdown === "about" ? null : "about"),
      dropdown: openDropdown === "about" ? <AboutUsDropdown isMobile={mobileMenuOpen} /> : null,
    },
    ...(isAuthenticated ? [{
      key: "announcements",
      label: "Announcements",
      to: "/announcements",
      isActive: location.pathname === "/announcements",
    }] : []),
    {
      key: "events",
      label: "Partnership & Events",
      to: "/partnership&events",
      isActive: isPartnershipAndEventsRoute,
    },
    {
      key: "learn",
      label: "Learn About Your Child",
      to: "/login",
      isActive: location.pathname === "/login",
    },
  ];

  return (
    <>
      <header className="bg-(--navbar-bg) px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Logo + Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/homepage" className="relative h-14 w-14 sm:h-16 sm:w-16 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src="/Logo.png"
                alt="Bayog Elementary National School Logo"
                className="object-contain"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavbarMenu items={navItems} navRef={navRef} />
            </div>

            {/* Mobile Menu Toggle - Left Side */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-900 hover:text-gray-700 transition-colors p-2"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Right: Login/Register Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              className={`h-10 w-24 sm:w-28 rounded-full px-4 sm:px-6 text-sm font-semibold transition-colors ${
                isRegisterPage
                  ? "bg-(--button-white) text-(--button-green) hover:bg-(--button-gray)"
                  : "bg-(--button-green) text-(--button-white) hover:bg-(--button-hover-green)"
              }`}
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className={`h-10 w-24 sm:w-28 rounded-full px-4 sm:px-6 text-sm font-semibold transition-colors ${
                isRegisterPage
                  ? "bg-(--button-green) text-(--button-white) hover:bg-(--button-hover-green)"
                  : "bg-(--button-white) text-(--button-green) hover:bg-(--button-gray)"
              }`}
            >
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu - Slides in from Left */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <nav className="fixed left-0 top-0 h-screen w-72 bg-(--navbar-bg) z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl">
            {/* Close Button */}
            <div className="flex items-center justify-between px-5 py-4">
              <Link to="/homepage" className="relative h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                <img
                  src="/Logo.png"
                  alt="Bayog Elementary National School Logo"
                  className="object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-900 hover:text-gray-700 transition-colors p-2"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="px-5 pb-6">
              <NavbarMenu items={navItems} navRef={navRef} isMobile />
            </div>
          </nav>
        </>
      )}
    </>
  );
};
