import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAuthUser, getAuthUser, setAuthUser, type AuthUser } from "@/lib/auth";
import {
  loadProfileModalData,
  saveProfileModalData,
  type ProfileModalData,
} from "./profileModalData";
import { MyProfileModal } from "./MyProfileModal";
import { ManageAccountModal } from "./ManageAccountModal";
import { ChangePasswordModal } from "./ChangePasswordModal";

type ActiveProfileModal = "my-profile" | "manage-account" | "change-password" | null;

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveProfileModal>(null);
  const [authUser, setAuthUserState] = useState<AuthUser | null>(() => getAuthUser());
  const [profileData, setProfileData] = useState<ProfileModalData>(() =>
    loadProfileModalData(getAuthUser())
  );
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openModal = (modalType: Exclude<ActiveProfileModal, null>) => {
    setActiveModal(modalType);
    setIsOpen(false);
  };

  const closeModal = () => setActiveModal(null);

  const handleSaveProfile = (updatedProfileData: ProfileModalData): { success: boolean; message: string } => {
    if (!updatedProfileData.email.includes("@")) {
      return { success: false, message: "Enter a valid email address." };
    }

    setProfileData(updatedProfileData);
    saveProfileModalData(updatedProfileData);

    if (authUser) {
      const updatedAuthUser: AuthUser = {
        ...authUser,
        name: updatedProfileData.fullName,
        email: updatedProfileData.email,
      };
      setAuthUser(updatedAuthUser);
      setAuthUserState(updatedAuthUser);
    }

    return { success: true, message: "Profile updated successfully." };
  };

  const handleChangePassword = (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; message: string } => {
    if (!authUser) {
      return { success: false, message: "No authenticated user found." };
    }

    const passwordKey = `dummyAuthPassword:${authUser.email.toLowerCase()}`;
    const savedPassword = localStorage.getItem(passwordKey);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return { success: false, message: "All password fields are required." };
    }

    if (savedPassword && currentPassword !== savedPassword) {
      return { success: false, message: "Current password is incorrect." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New password and confirmation do not match." };
    }

    if (currentPassword === newPassword) {
      return { success: false, message: "New password must be different from current password." };
    }

    localStorage.setItem(passwordKey, newPassword);
    return { success: true, message: "Password updated successfully." };
  };

  const handleLogout = () => {
    clearAuthUser();
    setIsOpen(false);
    navigate("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-12 w-12 overflow-hidden rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors"
        aria-label="Open profile menu"
      >
        {profileData.profilePicture ? (
          <img
            src={profileData.profilePicture}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-56">
          <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-(--button-hover-green) bg-(--button-green)" />
          <div className="relative origin-top-right overflow-hidden rounded-xl border border-(--button-hover-green) bg-(--button-green) py-1 shadow-2xl transition-all duration-200 hover:shadow-2xl">
            <button
              type="button"
              onClick={() => openModal("my-profile")}
              className="block w-full px-4 py-2 text-left text-base font-medium text-white transition-all duration-200 hover:bg-(--button-hover-green) hover:pl-5 hover:tracking-wide"
            >
              My Profile
            </button>
            <button
              type="button"
              onClick={() => openModal("manage-account")}
              className="block w-full px-4 py-2 text-left text-base font-medium text-white transition-all duration-200 hover:bg-(--button-hover-green) hover:pl-5 hover:tracking-wide"
            >
              Manage Account
            </button>
            <button
              type="button"
              onClick={() => openModal("change-password")}
              className="block w-full px-4 py-2 text-left text-base font-medium text-white transition-all duration-200 hover:bg-(--button-hover-green) hover:pl-5 hover:tracking-wide"
            >
              Change Password
            </button>
            <div className="mx-3 my-1 border-t border-white/30" />
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-base font-semibold text-white transition-all duration-200 hover:bg-(--button-hover-green) hover:pl-5 hover:tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <MyProfileModal
        isOpen={activeModal === "my-profile"}
        onClose={closeModal}
        profileData={profileData}
      />

      <ManageAccountModal
        isOpen={activeModal === "manage-account"}
        onClose={closeModal}
        profileData={profileData}
        onSave={handleSaveProfile}
      />

      <ChangePasswordModal
        isOpen={activeModal === "change-password"}
        onClose={closeModal}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};
