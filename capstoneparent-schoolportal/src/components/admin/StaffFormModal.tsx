import React from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

type StaffStatus = "ACTIVE" | "INACTIVE";

interface StaffFormData {
  name: string;
  contactNo: string;
  dateOfBirth: string;
  address: string;
  email: string;
  status: StaffStatus;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitLabel: string;
  formData: StaffFormData;
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>;
  selectedRoles: string[];
  availableRoles: string[];
  onToggleRole: (role: string) => void;
  disableSubmit?: boolean;
}

export const StaffFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel,
  formData,
  setFormData,
  selectedRoles,
  availableRoles,
  onToggleRole,
  disableSubmit = false,
}: StaffFormModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Contact No"
          value={formData.contactNo}
          onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Date of Birth (MM/DD/YYYY)"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
        />
        <div>
          <label className="block text-lg font-semibold mb-2">Role/s:</label>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onToggleRole(role)}
                className={`px-4 py-2 rounded-md text-base font-medium transition-colors ${
                  selectedRoles.includes(role)
                    ? "bg-(--button-green) text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
        >
          <option value="ACTIVE" className="text-green-600">ACTIVE</option>
          <option value="INACTIVE" className="text-red-600">INACTIVE</option>
        </select>
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={disableSubmit}
            className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
