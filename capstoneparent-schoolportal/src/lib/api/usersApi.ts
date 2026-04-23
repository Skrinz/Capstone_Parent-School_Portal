/**
 * src/lib/api/usersApi.ts
 */
import { apiFetch, bearerHeaders } from "./base";
import type { ApiData, ApiList, ApiMessage, AuthUser } from "./types";

export const usersApi = {
  list(params?: { role?: string; limit?: number; page?: number }) {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (typeof params?.limit === "number") query.set("limit", String(params.limit));
    if (typeof params?.page === "number") query.set("page", String(params.page));
    const suffix = query.toString();
    return apiFetch<ApiList<AuthUser>>(`/users${suffix ? `?${suffix}` : ""}`, {
      headers: bearerHeaders(),
    });
  },

  updateProfile(userId: number, data: any) {
    return apiFetch<ApiData<AuthUser>>(`/users/${userId}`, {
      method: "PUT",
      successMessage: "Profile updated successfully.",
      skipErrorFeedback: true,
      headers: { 
        ...bearerHeaders(),
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data),
    });
  },

  updateAccountSettings(
    userId: number,
    data: { account_status?: "Active" | "Inactive"; roles?: string[] },
  ) {
    return apiFetch<ApiData<AuthUser>>(`/users/${userId}/account`, {
      method: "PATCH",
      successMessage: "Account settings updated successfully.",
      headers: { 
        ...bearerHeaders(),
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data),
    });
  },

  delete(userId: number) {
    return apiFetch<ApiMessage>(`/users/${userId}`, {
      method: "DELETE",
      successMessage: "Staff account deleted successfully.",
      headers: bearerHeaders(),
    });
  },

  uploadProfilePicture(userId: number, file: File) {
    const formData = new FormData();
    formData.append("photo", file);

    return apiFetch<ApiData<AuthUser>>(`/users/${userId}/photo`, {
      method: "POST",
      successMessage: "Profile picture updated successfully.",
      skipErrorFeedback: true,
      headers: bearerHeaders(),
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
      successMessage: "Password changed successfully.",
      skipErrorFeedback: true,
      headers: { 
        ...bearerHeaders(),
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
