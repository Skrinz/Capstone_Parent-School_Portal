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

const normalizeDateForInput = (value?: string | null): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

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
    dateOfBirth: normalizeDateForInput(authUser?.date_of_birth),
    profilePicture: authUser?.photo_path ?? defaultProfileModalData.profilePicture,
  };
};

export const loadProfileModalData = (authUser: SessionUser | null): ProfileModalData => {
  return buildProfileModalData(authUser);
};

export const saveProfileModalData = (_profileData: ProfileModalData): void => {
  // No longer caching profile in localStorage to ensure data is always tied to the authenticated user.
};
