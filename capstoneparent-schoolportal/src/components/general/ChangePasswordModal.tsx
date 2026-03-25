import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<{ success: boolean; message: string }>;
}

export const ChangePasswordModal = ({
  isOpen,
  onClose,
  onChangePassword,
}: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus(null);
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const result = await onChangePassword(
      currentPassword,
      newPassword,
      confirmPassword,
    );

    setStatus({
      type: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="current-password"
            className="mb-2 block text-base font-semibold text-gray-900"
          >
            Current Password
          </label>
          <Input
            id="current-password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-11 rounded-md border border-gray-300 bg-white"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-base font-semibold text-gray-900"
          >
            New Password
          </label>
          <Input
            id="new-password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="h-11 rounded-md border border-gray-300 bg-white"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-2 block text-base font-semibold text-gray-900"
          >
            Confirm New Password
          </label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-11 rounded-md border border-gray-300 bg-white"
            disabled={isLoading}
          />
        </div>

        {status ? (
          <p
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              status.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 rounded-full bg-(--button-green) px-8 text-base font-semibold text-white hover:bg-(--button-hover-green) disabled:opacity-60"
          >
            {isLoading ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
