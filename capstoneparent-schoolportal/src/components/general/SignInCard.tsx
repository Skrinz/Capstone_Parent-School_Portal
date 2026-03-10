import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import {
  setAuthUser,
  setJwt,
  setDeviceToken,
  getDeviceToken,
  mapBackendRole,
  getDefaultRouteForRole,
  type UserRole,
} from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "credentials" | "otp";

interface BackendUser {
  user_id: number;
  email: string;
  fname: string;
  lname: string;
  roles: { role: string }[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive httpOnly cookies
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? "Request failed");
  }

  return json as T;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Pick the "best" frontend role from the user's role list.
 * Priority: Admin/Principal/Vice_Principal > Teacher > Librarian > Parent > Staff
 */
function resolveFrontendRole(roles: { role: string }[]): UserRole {
  const PRIORITY: string[] = [
    "admin",
    "principal",
    "vice_principal",
    "teacher",
    "librarian",
    "parent",
    "staff",
  ];

  const sorted = [...roles].sort((a, b) => {
    const ai = PRIORITY.indexOf(a.role.toLowerCase());
    const bi = PRIORITY.indexOf(b.role.toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return mapBackendRole(sorted[0]?.role ?? "staff");
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SignInCard = () => {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ── Finish: store session and navigate ──────────────────────────────────────
  const finalise = (
    token: string,
    user: BackendUser,
    rawDeviceToken?: string,
  ) => {
    if (rawDeviceToken) setDeviceToken(rawDeviceToken);
    setJwt(token);

    const role = resolveFrontendRole(user.roles);
    setAuthUser({
      email: user.email,
      name: `${user.fname} ${user.lname}`,
      role,
      userId: user.user_id,
    });

    navigate(getDefaultRouteForRole(role));
  };

  // ── Step 1: credentials ─────────────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const storedDeviceToken = getDeviceToken();

      if (storedDeviceToken) {
        // Known device — skip OTP, login directly
        const res = await apiFetch<{
          data: { token: string; user: BackendUser };
        }>("/auth/login", { email, password, deviceToken: storedDeviceToken });
        finalise(res.data.token, res.data.user);
      } else {
        // Unknown device — request OTP first
        await apiFetch("/auth/send-otp", { email });
        setStep("otp");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";

      // If the stored device token was rejected, clear it and retry via OTP
      if (msg.toLowerCase().includes("unrecognized device")) {
        setDeviceToken(""); // clear stale token
        try {
          await apiFetch("/auth/send-otp", { email });
          setStep("otp");
        } catch {
          setError("Could not send OTP. Please try again.");
        }
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP verification ────────────────────────────────────────────────
  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch<{
        data: { token: string; user: BackendUser; deviceToken: string };
      }>("/auth/verify-otp", { email, otpCode });

      finalise(res.data.token, res.data.user, res.data.deviceToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/send-otp", { email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

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
              required
              disabled={loading}
              className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

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
              <span className="font-semibold">{email}</span>. Enter it below to
              verify this device.
            </p>

            <Input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              disabled={loading}
              maxLength={6}
              className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl tracking-widest text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
            />

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="pt-3 text-center">
              <Button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="h-12 min-w-36 rounded-full bg-(--button-green) px-10 text-2xl font-semibold text-white transition-colors hover:bg-(--button-hover-green) disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-1 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setOtpCode("");
                }}
                className="hover:underline"
              >
                ← Back
              </button>
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
