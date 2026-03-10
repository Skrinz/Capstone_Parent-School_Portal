import { useEffect, useState } from "react";
import { Navbar } from "@/components/general/Navbar";
import { NavbarAdmin } from "@/components/admin/NavbarAdmin";
import { NavbarTeacher } from "@/components/teacher/NavbarTeacher";
import { NavbarLibrarian } from "@/components/librarian/NavbarLibrarian";
import { NavbarParent } from "@/components/parent/NavbarParent";
import { NavbarStaff } from "@/components/staff/NavbarStaff";

type UserRole = "admin" | "teacher" | "librarian" | "parent" | "staff";

interface AuthUser {
  role?: UserRole;
}

const getStoredRole = (): UserRole | null => {
  const rawAuthUser = localStorage.getItem("dummyAuthUser");
  if (!rawAuthUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawAuthUser) as AuthUser;
    return parsedUser.role ?? null;
  } catch {
    return null;
  }
};

export const RoleAwareNavbar = () => {
  const [role, setRole] = useState<UserRole | null>(getStoredRole);

  useEffect(() => {
    setRole(getStoredRole());

    const handleStorage = () => {
      setRole(getStoredRole());
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (role === "admin") return <NavbarAdmin />;
  if (role === "teacher") return <NavbarTeacher />;
  if (role === "librarian") return <NavbarLibrarian />;
  if (role === "parent") return <NavbarParent />;
  if (role === "staff") return <NavbarStaff />;

  return <Navbar />;
};
