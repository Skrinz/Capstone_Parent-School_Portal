import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ProfileModalData } from "./profileModalData";

interface ManageAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileModalData;
  onSave: (updatedProfileData: ProfileModalData) => { success: boolean; message: string };
}

export const ManageAccountModal = ({ isOpen, onClose, profileData, onSave }: ManageAccountModalProps) => {
  const [formData, setFormData] = useState<ProfileModalData>(profileData);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(profileData);
    setStatus(null);
  }, [isOpen, profileData]);

  const handleFieldChange = (field: keyof ProfileModalData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      if (typeof fileReader.result === "string") {
        setFormData((prev) => ({ ...prev, profilePicture: fileReader.result as string }));
      }
    };
    fileReader.readAsDataURL(selectedFile);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.contactNo.trim() || !formData.email.trim()) {
      setStatus({ type: "error", message: "Full Name, Contact No, and Email are required." });
      return;
    }

    const saveResult = onSave({
      ...formData,
      fullName: formData.fullName.trim(),
      contactNo: formData.contactNo.trim(),
      dateOfBirth: formData.dateOfBirth.trim(),
      address: formData.address.trim(),
      email: formData.email.trim(),
    });

    setStatus({
      type: saveResult.success ? "success" : "error",
      message: saveResult.message,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Account" contentClassName="max-w-5xl">
      <form className="space-y-3 px-1 pb-2 pt-1" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="full-name" className="text-lg font-medium text-gray-900">Full Name:</label>
          <Input
            id="full-name"
            value={formData.fullName}
            onChange={(event) => handleFieldChange("fullName", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="contact-no" className="text-lg font-medium text-gray-900">Contact No:</label>
          <Input
            id="contact-no"
            value={formData.contactNo}
            onChange={(event) => handleFieldChange("contactNo", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="date-of-birth" className="text-lg font-medium text-gray-900">Date of Birth:</label>
          <Input
            id="date-of-birth"
            value={formData.dateOfBirth}
            onChange={(event) => handleFieldChange("dateOfBirth", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="address" className="text-lg font-medium text-gray-900">Address:</label>
          <Input
            id="address"
            value={formData.address}
            onChange={(event) => handleFieldChange("address", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="email" className="text-lg font-medium text-gray-900">Email:</label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-[180px_1fr] md:items-center">
          <p className="text-lg font-medium text-gray-900">Profile Picture:</p>
          <div className="flex items-center gap-3">
            <label htmlFor="profile-upload" className="inline-flex cursor-pointer items-center rounded-full bg-(--button-green) px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-(--button-hover-green)">
              Upload Picture +
            </label>
            <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
            <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-300 bg-gray-200">
              <img src={formData.profilePicture} alt="Profile preview" className="h-full w-full object-cover" />
            </div>
          </div>
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

        <div className="flex justify-end pt-2">
          <Button type="submit" className="h-12 rounded-full bg-(--button-green) px-8 text-xl font-semibold text-white hover:bg-(--button-hover-green)">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
