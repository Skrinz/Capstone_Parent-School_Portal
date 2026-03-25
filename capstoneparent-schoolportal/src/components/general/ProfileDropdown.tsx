import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../lib/store/authStore";
import {
  loadProfileModalData,
  saveProfileModalData,
  type ProfileModalData,
} from "./profileModalData";
import { MyProfileModal } from "./MyProfileModal";
import { ManageAccountModal } from "./ManageAccountModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { LogoutConfirmationModal } from "./LogoutConfirmationModal";
import { authApi, usersApi } from "@/lib/api";

type ActiveProfileModal =
  | "my-profile"
  | "manage-account"
  | "change-password"
  | null;

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveProfileModal>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { user, logout: storeLogout } = useAuthStore();

  const [profileData, setProfileData] = useState<ProfileModalData>(() =>
    loadProfileModalData(user),
  );

  // Keep profileData in sync if the store user changes (e.g. after re-login)
  useEffect(() => {
    setProfileData(loadProfileModalData(user));
  }, [user]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openModal = (modalType: Exclude<ActiveProfileModal, null>) => {
    setActiveModal(modalType);
    setIsOpen(false);
    setSuccessMsg(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSuccessMsg(null);
  };

  const handleSaveProfile = async (
    updatedProfileData: ProfileModalData,
    profileFile?: File
  ): Promise<{ success: boolean; message: string }> => {
    if (!updatedProfileData.email.includes("@")) {
      return { success: false, message: "Enter a valid email address." };
    }

    if (!user) {
      return { success: false, message: "You are not logged in." };
    }

    setIsSavingProfile(true);

    try {
      // 1. Update Profile Fields
      const profilePayload = {
        fname: updatedProfileData.fname,
        lname: updatedProfileData.lname,
        contact_num: updatedProfileData.contactNo,
        address: updatedProfileData.address,
        email: updatedProfileData.email,
        date_of_birth: updatedProfileData.dateOfBirth,
      };
      
      await usersApi.updateProfile(user.userId, profilePayload);

      // 2. Upload Profile Picture if provided
      if (profileFile) {
        const photoRes = await usersApi.uploadProfilePicture(user.userId, profileFile);
        if (photoRes.data?.photo_path) {
          updatedProfileData.profilePicture = photoRes.data.photo_path;
        }
      }

      setProfileData(updatedProfileData);
      saveProfileModalData(updatedProfileData);

      // Sync the display name and explicitly mapped profile fields in the store
      useAuthStore.setState({
        user: { 
          ...user, 
          name: `${updatedProfileData.fname} ${updatedProfileData.lname}`,
          contact_num: updatedProfileData.contactNo,
          address: updatedProfileData.address,
          date_of_birth: updatedProfileData.dateOfBirth,
          photo_path: updatedProfileData.profilePicture
        },
      });

      setActiveModal("my-profile");
      setSuccessMsg("Profile updated successfully.");

      return { success: true, message: "Profile updated successfully." };
    } catch (err: any) {
      return { success: false, message: err.message || "An error occurred." };
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    // --- front-end validation (fast, no round-trip needed) ---
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      return { success: false, message: "All password fields are required." };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: "New password must be at least 8 characters.",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "New password and confirmation do not match.",
      };
    }

    if (currentPassword === newPassword) {
      return {
        success: false,
        message: "New password must be different from the current password.",
      };
    }

    if (!user) {
      return { success: false, message: "You are not logged in." };
    }

    // --- API call ---
    try {
      await usersApi.changePassword(user.userId, currentPassword, newPassword);
      return { success: true, message: "Password changed successfully." };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "An error occurred. Please try again.",
      };
    }
  };


  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Server-side logout failed (expired session, network error, etc.).
      // Proceed with local cleanup regardless.
    } finally {
      storeLogout();
      setIsLogoutConfirmOpen(false);
      setIsOpen(false);
      setIsLoggingOut(false);
      navigate("/login");
    }
  };

  const openLogoutConfirmation = () => {
    setIsOpen(false);
    setIsLogoutConfirmOpen(true);
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
              onClick={openLogoutConfirmation}
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
        successMessage={successMsg}
      />

      <ManageAccountModal
        isOpen={activeModal === "manage-account"}
        onClose={closeModal}
        profileData={profileData}
        onSave={handleSaveProfile}
        isSavingProfile={isSavingProfile}
      />

      <ChangePasswordModal
        isOpen={activeModal === "change-password"}
        onClose={closeModal}
        onChangePassword={handleChangePassword}
      />

      <LogoutConfirmationModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirmLogout={handleLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
};
