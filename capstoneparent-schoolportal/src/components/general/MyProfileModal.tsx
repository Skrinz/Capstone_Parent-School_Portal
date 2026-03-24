import { Modal } from "@/components/ui/modal";
import type { ProfileModalData } from "./profileModalData";

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileModalData;
  successMessage?: string | null;
}

export const MyProfileModal = ({ isOpen, onClose, profileData, successMessage }: MyProfileModalProps) => {
  const rows = [
    { label: "First Name", value: profileData.fname },
    { label: "Last Name", value: profileData.lname },
    { label: "Contact No.", value: profileData.contactNo },
    { label: "Date of Birth", value: profileData.dateOfBirth },
    { label: "Address", value: profileData.address },
    { label: "Email", value: profileData.email },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile" contentClassName="max-w-5xl">
      <div className="grid grid-cols-1 gap-6 px-1 pb-4 pt-1 md:grid-cols-[260px_1fr] md:gap-8">
        <div className="mx-auto h-64 w-64 overflow-hidden rounded-lg border border-gray-300 bg-gray-200">
          <img src={profileData.profilePicture} alt="Profile" className="h-full w-full object-cover" />
        </div>

        <div className="space-y-3">
          {successMessage && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              {successMessage}
            </p>
          )}
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-1 gap-1 rounded-md bg-white/60 px-4 py-3 md:grid-cols-[180px_1fr] md:items-center">
              <p className="text-lg font-medium text-gray-900">{row.label}:</p>
              <p className="text-xl font-bold text-gray-900 wrap-break-word">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
