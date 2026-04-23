import { memo, useEffect, useRef, useState } from "react";
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
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

type ActiveProfileModal =
  | "my-profile"
  | "manage-account"
  | "change-password"
  | null;

const datePartsFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const formatCurrentDateTime = (date: Date) => {
  const parts = datePartsFormatter.formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${valueByType.weekday}, ${valueByType.month} ${valueByType.day}, ${valueByType.year}, ${valueByType.hour}:${valueByType.minute}:${valueByType.second} ${valueByType.dayPeriod}`;
};

const CurrentDateTimeBadge = memo(() => {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return (
    <div className="absolute bottom-full right-0 mb-2 px-1 text-sm font-medium whitespace-nowrap text-gray-900">
      {formatCurrentDateTime(currentDateTime)}
    </div>
  );
});

CurrentDateTimeBadge.displayName = "CurrentDateTimeBadge";

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveProfileModal>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const { showSuccess } = useApiFeedbackStore();
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
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleSaveProfile = async (
    updatedProfileData: ProfileModalData,
    profileFile?: File
  ): Promise<{ success: boolean; message: string }> => {


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
      showSuccess("Profile updated successfully.");

      return { success: true, message: "Profile updated successfully." };
    } catch (err: any) {
      return { success: false, message: err.message || "An error occurred."};
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> => {
    // --- front-end validation (fast, no round-trip needed) ---
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      throw new Error("All password fields are required.");
    }

    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirmation do not match.");
    }

    if (currentPassword === newPassword) {
      throw new Error("New password must be different from the current password.");
    }

    if (!user) {
      throw new Error("You are not logged in.");
    }

    // --- API call (apiFetch handles notifications) ---
    await usersApi.changePassword(user.userId, currentPassword, newPassword);
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
      <CurrentDateTimeBadge />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
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
