import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  setDeviceToken,
  getDeviceToken,
  clearDeviceToken,
  getDefaultRouteForRole,
} from "@/lib/auth";
import { authApi, type AuthUser } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "credentials" | "otp";

// ─── Component ───────────────────────────────────────────────────────────────

export const SignInCard = () => {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, clearFeedback } = useApiFeedbackStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoVerifyStartedRef = useRef(false);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ── Finish: store session and navigate ──────────────────────────────────────
  // NOTE: device token is always written per-email BEFORE calling finalise,
  // so no rawDeviceToken parameter is needed here.
  const finalise = (token: string, user: AuthUser) => {
    useAuthStore.getState().loginSuccess(token, user);

    const role = useAuthStore.getState().user?.role ?? "staff";
    navigate(getDefaultRouteForRole(role));
  };
  //masking the email
  const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) {
    return local[0] + "*".repeat(local.length - 1) + "@" + domain;
  }
  return local.slice(0, 2) + "*".repeat(local.length - 2) + "@" + domain;
};

  // ── Step 1: credentials ─────────────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      showError("Email is required.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      showError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      showError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const storedDeviceToken = getDeviceToken(normalizedEmail);

      if (storedDeviceToken) {
        const res = await authApi.login(normalizedEmail, password, storedDeviceToken);
        finalise(res.data.token, res.data.user);
      } else {
        await authApi.sendOtp(normalizedEmail);
        setEmail(normalizedEmail);
        setStep("otp");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";

      if (msg.toLowerCase().includes("unrecognized device")) {
        clearDeviceToken(normalizedEmail);
        try {
          await authApi.sendOtp(normalizedEmail);
          setEmail(normalizedEmail);
          setStep("otp");
        } catch {
          showError("Could not send OTP. Please try again.");
        }
      } else {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP verification ────────────────────────────────────────────────
  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      showError("Email is required before OTP verification.");
      return;
    }
    if (otpCode.length !== 6) {
      showError("OTP code must be exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.verifyOtp(normalizedEmail, otpCode);
      // Save device token keyed to this specific email
      if (res.data.deviceToken) {
        setDeviceToken(res.data.deviceToken, normalizedEmail);
      }
      finalise(res.data.token, res.data.user);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearFeedback();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      showError("Email is required before resending OTP.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      showError("Please enter a valid email address before resending OTP.");
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(normalizedEmail);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const emailFromLink = searchParams.get("email")?.trim() ?? "";
    const otpFromLink = searchParams.get("otp")?.trim() ?? "";
    const shouldAutoVerify = searchParams.get("autoVerify") === "1";
    const normalizedOtpFromLink = otpFromLink.replace(/\D/g, "").slice(0, 6);
    const autoVerifyKey = `otp-auto-verify:${emailFromLink}:${normalizedOtpFromLink}`;

    if (emailFromLink) {
      setEmail(emailFromLink);
    }

    if (normalizedOtpFromLink) {
      setOtpCode(normalizedOtpFromLink);
      setStep("otp");
    }

    if (
      !shouldAutoVerify ||
      autoVerifyStartedRef.current ||
      sessionStorage.getItem(autoVerifyKey) === "done" ||
      !emailFromLink ||
      normalizedOtpFromLink.length !== 6
    ) {
      return;
    }

    autoVerifyStartedRef.current = true;
    sessionStorage.setItem(autoVerifyKey, "done");
    setStep("otp");
    clearFeedback();
    setLoading(true);

    void authApi
      .verifyOtp(emailFromLink, normalizedOtpFromLink)
      .then((res) => {
        showSuccess("OTP verified successfully.");
        // Save device token keyed to this specific email
        if (res.data.deviceToken) {
          setDeviceToken(res.data.deviceToken, emailFromLink);
        }
        finalise(res.data.token, res.data.user);
      })
      .catch((err) => {
        setLoading(false);
        sessionStorage.removeItem(autoVerifyKey);
        showError(
          err instanceof Error ? err.message : "Automatic OTP verification failed",
        );
        const next = new URLSearchParams(searchParams);
        next.delete("otp");
        next.delete("autoVerify");
        setSearchParams(next, { replace: true });
      });
  }, [clearFeedback, searchParams, setSearchParams, showError, showSuccess]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-96px)] bg-white px-4 py-12 md:py-16">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-(--signin-bg) px-8 py-10 md:px-12 md:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <img
            src="/Logo.png"
            alt="Bayog Elementary National School Logo"
            className="h-16 w-16 object-contain"
          />
          <h1 className="text-4xl font-bold text-gray-900">
            {step === "credentials" ? "Login" : "Verify Email"}
          </h1>
        </div>

        {/* ── Credentials step ── */}
        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="space-y-5">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
            />

            <p className="text-sm text-gray-900">
              Forgot password?{" "}
              <Link
                to="/forgotpassword"
                className="font-medium text-blue-600 hover:underline"
              >
                Click here
              </Link>
            </p>

            <div className="pt-3 text-center">
              <Button
                type="submit"
                disabled={loading}
                className="h-12 min-w-36 rounded-full bg-(--button-green) px-10 text-2xl font-semibold text-white transition-colors hover:bg-(--button-hover-green) disabled:opacity-60"
              >
                {loading ? "Please wait…" : "Sign In"}
              </Button>
            </div>
          </form>
        )}

        {/* ── OTP step ── */}
        {step === "otp" && (
          <form onSubmit={handleOtp} className="space-y-5">
            <p className="text-sm text-gray-600">
              A 6-digit code was sent to{" "}
              <span className="font-semibold">{maskEmail(email)}</span>. Enter it below to
              verify this device.
            </p>
            <p className="text-sm text-gray-600">
              You can click the automatic verification link from your email, or
              enter the OTP code manually here.
            </p>

            <Input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={loading}
              maxLength={6}
              className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl tracking-widest text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
            />

            <div className="pt-3 text-center">
              <Button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="h-12 min-w-36 rounded-full bg-(--button-green) px-10 text-2xl font-semibold text-white transition-colors hover:bg-(--button-hover-green) disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </div>

            <div className="flex items-center justify-end pt-1 text-sm text-gray-500">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
