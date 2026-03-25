/**
 * src/lib/api/usersApi.ts
 */
import { apiFetch } from "./base";
import type { ApiData, ApiMessage, AuthUser } from "./types";

export const usersApi = {
  updateProfile(userId: number, data: any) {
    return apiFetch<ApiData<AuthUser>>(`/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  uploadProfilePicture(userId: number, file: File) {
    const formData = new FormData();
    formData.append("photo", file);

    return apiFetch<ApiData<AuthUser>>(`/users/${userId}/photo`, {
      method: "POST",
      body: formData,
    });
  },

  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    return apiFetch<ApiMessage>(`/users/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
