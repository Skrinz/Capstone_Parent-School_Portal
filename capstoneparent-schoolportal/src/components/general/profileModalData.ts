import type { AuthUser } from "@/lib/auth";

export interface ProfileModalData {
  fullName: string;
  contactNo: string;
  dateOfBirth: string;
  address: string;
  email: string;
  profilePicture: string;
}

const defaultProfileModalData: ProfileModalData = {
  fullName: "Jane Doe",
  contactNo: "09874125689",
  dateOfBirth: "02/15/1987",
  address: "Sitio Pajak, Mandaue, Cebu",
  email: "janedoe@gmail.com",
  profilePicture: "/Logo.png",
};

const PROFILE_STORAGE_KEY = "dummyProfileData";

export const buildProfileModalData = (authUser: AuthUser | null): ProfileModalData => ({
  ...defaultProfileModalData,
  fullName: authUser?.name ?? defaultProfileModalData.fullName,
  email: authUser?.email ?? defaultProfileModalData.email,
});

export const loadProfileModalData = (authUser: AuthUser | null): ProfileModalData => {
  const fallback = buildProfileModalData(authUser);
  const rawProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!rawProfileData) return fallback;

  try {
    const parsed = JSON.parse(rawProfileData) as Partial<ProfileModalData>;
    return {
      ...fallback,
      ...parsed,
      fullName: parsed.fullName?.trim() || fallback.fullName,
      email: parsed.email?.trim() || fallback.email,
    };
  } catch {
    return fallback;
  }
};

export const saveProfileModalData = (profileData: ProfileModalData): void => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
};
