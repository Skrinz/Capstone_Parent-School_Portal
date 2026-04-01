import { Button } from "@/components/ui/button";
import { NavbarMenu, type NavbarMenuItem } from "@/components/general/NavbarMenu";
import { useState, useRef, useEffect } from "react"
import { AboutUsDropdown } from "./AboutUsDropdown";
import { useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/lib/store/authStore";

export const Navbar = () => {
  const { isAuthenticated } = useAuthStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const isRegisterPage = location.pathname === "/register";
  const isPartnershipAndEventsRoute = location.pathname.startsWith("/partnership&events");
  const aboutRoutes = [
    "/contactus",
    "/history",
    "/orginizationalchart",
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

  const navItems: NavbarMenuItem[] = [
    {
      key: "about",
      label: "About Us",
      type: "dropdown",
      isActive: isAboutSelected || openDropdown === "about",
      onClick: () => setOpenDropdown(openDropdown === "about" ? null : "about"),
      dropdown: openDropdown === "about" ? <AboutUsDropdown /> : null,
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
      label: "Learn about your child",
      to: "/login",
      isActive: location.pathname === "/login",
    },
  ];

  return (
    <header className="bg-(--navbar-bg) px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/homepage" className="relative h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src="/Logo.png"
              alt="Bayog Elementary National School Logo"
              className="object-contain"
            />
          </Link>
          <NavbarMenu items={navItems} navRef={navRef} />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <Button
            asChild
            className={`h-10 w-32 rounded-full px-12 text-base text-[20px] font-semibold transition-colors ${
              isRegisterPage
                ? "bg-(--button-white) text-(--button-green) hover:bg-(--button-gray)"
                : "bg-(--button-green) text-(--button-white) hover:bg-(--button-hover-green)"
            }`}
          >
            <Link to="/login">Login</Link>
          </Button>

          <Button
            asChild
            className={`h-10 w-32 rounded-full px-12 text-base text-[20px] font-semibold transition-colors ${
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
  );
};
