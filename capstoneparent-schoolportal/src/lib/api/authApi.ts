/**
 * src/lib/api/auth.ts
 */

import { apiFetch, bearerHeaders } from "./base";
import type { ApiMessage, ApiData, AuthUser } from "./types";

export const authApi = {
  // POST /api/auth/register/parent
  register(formData: FormData) { // keeping name `register` to avoid breaking frontend immediately
    return apiFetch<ApiMessage>("/auth/register/parent", {
      method: "POST",
      body: formData,
    });
  },

  // POST /api/auth/register/employee
  registerEmployee(formData: FormData) {
    return apiFetch<ApiMessage>("/auth/register/employee", {
      method: "POST",
      headers: bearerHeaders(),
      body: formData,
    });
  },

  // POST /api/auth/verify-registration-otp
  verifyRegistrationOtp(email: string, otpCode: string) {
    return apiFetch<ApiData<{ user: AuthUser; deviceToken: string }>>(
      "/auth/verify-registration-otp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
      },
    );
  },

  // POST /api/auth/resend-registration-otp
  resendRegistrationOtp(email: string) {
    return apiFetch<ApiMessage>("/auth/resend-registration-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  // POST /api/auth/login
  login(email: string, password: string, deviceToken?: string) {
    return apiFetch<ApiData<{ token: string; user: AuthUser }>>("/auth/login", {
      method: "POST",
      successMessage: "Logged in successfully.",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceToken }),
    });
  },

  // POST /api/auth/send-otp
  sendOtp(email: string) {
    return apiFetch<ApiMessage>("/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  // POST /api/auth/verify-otp
  verifyOtp(email: string, otpCode: string) {
    return apiFetch<
      ApiData<{ token: string; user: AuthUser; deviceToken: string }>
    >("/auth/verify-otp", {
      method: "POST",
      successMessage: "Logged in successfully.",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otpCode }),
    });
  },

  // POST /api/auth/logout
  logout() {
    return apiFetch<ApiMessage>("/auth/logout", {
      method: "POST",
      successMessage: "Logged out successfully.",
      skipErrorFeedback: true,
      headers: {
        "Content-Type": "application/json",
        ...bearerHeaders(),
      },
    });
  },

  // POST /api/auth/forgot-password
  forgotPassword(email: string) {
    return apiFetch<ApiMessage>("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  // GET /api/auth/reset-password-info?token=...
  getResetPasswordInfo(token: string) {
    return apiFetch<ApiData<{ maskedEmail: string }>>(
      `/auth/reset-password-info?token=${encodeURIComponent(token)}`,
    );
  },

  // POST /api/auth/reset-password
  resetPassword(token: string, newPassword: string) {
    return apiFetch<ApiMessage>("/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
  },
};
