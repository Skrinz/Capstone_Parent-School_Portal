import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { FormInputError } from "@/components/ui/FormInputError";
import type { ProfileModalData } from "./profileModalData";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";

interface ManageAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileModalData;
  isSavingProfile?: boolean;
  onSave: (updatedProfileData: ProfileModalData, file?: File) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
}

export const ManageAccountModal = ({ isOpen, onClose, profileData, isSavingProfile, onSave }: ManageAccountModalProps) => {
  const [formData, setFormData] = useState<ProfileModalData>(profileData);
  const [profileFile, setProfileFile] = useState<File>();
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { showSuccess, clearFeedback } = useApiFeedbackStore();

  useEffect(() => {
    if (!isOpen) return;
    setFormData(profileData);
    setProfileFile(undefined);
    setInlineError(null);
    clearFeedback();
  }, [isOpen, profileData, clearFeedback]);

  const handleFieldChange = (field: keyof ProfileModalData, value: string) => {
    setInlineError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateFiles([selectedFile], {
      acceptedTypes: [".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
      label: "profile picture",
    });
    if (!validation.valid) {
      setProfileFile(undefined);
      setInlineError(validation.error);
      event.target.value = "";
      return;
    }

    const fileReader = new FileReader();
    setProfileFile(selectedFile);
    fileReader.onload = () => {
      if (typeof fileReader.result === "string") {
        setFormData((prev) => ({ ...prev, profilePicture: fileReader.result as string }));
      }
    };
    fileReader.readAsDataURL(selectedFile);
  };

  const hasChanges =
    formData.fname.trim() !== profileData.fname.trim() ||
    formData.lname.trim() !== profileData.lname.trim() ||
    formData.contactNo.trim() !== profileData.contactNo.trim() ||
    formData.dateOfBirth.trim() !== profileData.dateOfBirth.trim() ||
    formData.address.trim() !== profileData.address.trim() ||
    Boolean(profileFile);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInlineError(null);
    clearFeedback();

    if (!formData.fname.trim()) {
      setInlineError("First name is required.");
      return;
    }
    if (!formData.lname.trim()) {
      setInlineError("Last name is required.");
      return;
    }
    if (!formData.contactNo.trim()) {
      setInlineError("Contact number is required.");
      return;
    }


    try {
      const result = await onSave({
        ...formData,
        fname: formData.fname.trim(),
        lname: formData.lname.trim(),
        contactNo: formData.contactNo.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        address: formData.address.trim(),
      }, profileFile);

      if (result.success) {
        showSuccess(result.message || "Account updated successfully.");
      } else {
        setInlineError(result.message || "Failed to update account.");
      }
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Account" contentClassName="max-w-5xl">
      <form className="space-y-3 px-1 pb-2 pt-1" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="first-name" className="text-lg font-medium text-gray-900">First Name:</label>
          <Input
            id="first-name"
            value={formData.fname}
            onChange={(event) => handleFieldChange("fname", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="last-name" className="text-lg font-medium text-gray-900">Last Name:</label>
          <Input
            id="last-name"
            value={formData.lname}
            onChange={(event) => handleFieldChange("lname", event.target.value)}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="contact-no" className="text-lg font-medium text-gray-900">Contact No:</label>
          <Input
            id="contact-no"
            type="tel"
            value={formData.contactNo}
            onChange={(event) => handleFieldChange("contactNo", event.target.value.replace(/\D/g, ""))}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr] md:items-center">
          <label htmlFor="date-of-birth" className="text-lg font-medium text-gray-900">Date of Birth:</label>
          <Input
            id="date-of-birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(event) => handleFieldChange("dateOfBirth", event.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="h-12 rounded-md border border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900 [color-scheme:light]"
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
            readOnly
            className="h-12 rounded-md border border-gray-300 bg-gray-100 px-4 text-lg font-semibold text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-[180px_1fr] md:items-start">
          <p className="text-lg font-medium text-gray-900 md:pt-2">Profile Picture:</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <label htmlFor="profile-upload" className="inline-flex cursor-pointer items-center rounded-full bg-(--button-green) px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-(--button-hover-green)">
                Upload Picture +
              </label>
              <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
              <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-300 bg-gray-200">
                <img src={formData.profilePicture} alt="Profile preview" className="h-full w-full object-cover" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Accepted: JPEG, PNG · Max 5 MB</p>
          </div>
        </div>

        <FormInputError message={inlineError ?? undefined} className="px-1" />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSavingProfile || !hasChanges} className="h-12 rounded-full bg-(--button-green) px-8 text-xl font-semibold text-white hover:bg-(--button-hover-green) disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400">
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
