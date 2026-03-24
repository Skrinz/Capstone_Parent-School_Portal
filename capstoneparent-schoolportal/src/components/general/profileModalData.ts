import type { SessionUser } from "../../lib/store/authStore";

export interface ProfileModalData {
  fname: string;
  lname: string;
  contactNo: string;
  dateOfBirth: string;
  address: string;
  email: string;
  profilePicture: string;
}

const defaultProfileModalData: ProfileModalData = {
  fname: "",
  lname: "",
  contactNo: "",
  dateOfBirth: "",
  address: "",
  email: "",
  profilePicture: "",
};

const PROFILE_STORAGE_KEY = "userProfileData";

export const buildProfileModalData = (authUser: SessionUser | null): ProfileModalData => {
  const [fname = "", ...rest] = (authUser?.name ?? "").split(" ");
  const lname = rest.join(" ");

  return {
    ...defaultProfileModalData,
    fname: authUser?.name ? fname : defaultProfileModalData.fname,
    lname: authUser?.name ? lname : defaultProfileModalData.lname,
    email: authUser?.email ?? defaultProfileModalData.email,
    contactNo: authUser?.contact_num ?? defaultProfileModalData.contactNo,
    address: authUser?.address ?? defaultProfileModalData.address,
    dateOfBirth: authUser?.date_of_birth ? authUser.date_of_birth.substring(0, 10) : defaultProfileModalData.dateOfBirth,
    profilePicture: authUser?.photo_path ?? defaultProfileModalData.profilePicture,
  };
};

export const loadProfileModalData = (authUser: SessionUser | null): ProfileModalData => {
  const fallback = buildProfileModalData(authUser);
  const rawProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!rawProfileData) return fallback;

  try {
    const parsed = JSON.parse(rawProfileData) as Partial<ProfileModalData>;
    return {
      ...fallback,
      ...parsed,
      fname: parsed.fname?.trim() || fallback.fname,
      lname: parsed.lname?.trim() || fallback.lname,
      email: parsed.email?.trim() || fallback.email,
    };
  } catch {
    return fallback;
  }
};

export const saveProfileModalData = (profileData: ProfileModalData): void => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
};
