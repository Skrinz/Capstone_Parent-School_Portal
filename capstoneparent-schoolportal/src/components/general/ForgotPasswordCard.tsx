import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

export const ForgotPasswordCard = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess, clearFeedback } = useApiFeedbackStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsLoading(true);

    try {
      const result = await authApi.forgotPassword(email);
      showSuccess(
        result.message ||
          "If that email is registered, a password reset link has been sent. The link expires in 10 minutes.",
      );
      setEmail("");
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] bg-white px-4 py-12 md:py-16">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-(--signin-bg) px-8 py-10 md:px-12 md:py-12">
        <h1 className="mb-10 text-center text-5xl font-bold text-gray-900">
         Password Reset
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            required
            disabled={isLoading}
            className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
          />



          <div className="pt-2 text-center">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 min-w-36 rounded-full bg-(--button-green) px-10 text-2xl font-semibold text-white transition-colors hover:bg-(--button-hover-green) disabled:opacity-60"
            >
              {isLoading ? "Sending…" : "Enter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
