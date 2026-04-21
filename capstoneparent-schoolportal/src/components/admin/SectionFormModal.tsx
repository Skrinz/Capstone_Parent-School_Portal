import React from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

interface SectionFormData {
  name: string;
}

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitLabel: string;
  formData: SectionFormData;
  setFormData: React.Dispatch<React.SetStateAction<SectionFormData>>;
  disableSubmit?: boolean;
  isLoading?: boolean;
  errors?: Partial<Record<keyof SectionFormData, string>>;
}

export const SectionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel,
  formData,
  setFormData,
  disableSubmit = false,
  isLoading = false,
  errors = {},
}: SectionFormModalProps) => {
  const getFieldClassName = (fieldName: keyof SectionFormData) => {
    const borderClass = errors[fieldName]
      ? "border-red-500 focus:ring-red-500"
      : "border-black focus:ring-(--button-green)";
    return `w-full px-4 py-3 text-lg border-2 rounded-md focus:outline-none focus:ring-2 placeholder-gray-400 ${borderClass}`;
  };

  const renderError = (fieldName: keyof SectionFormData) => {
    if (errors[fieldName]) {
      return (
        <p className="mt-1 text-sm font-medium text-red-600">
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Section name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={getFieldClassName("name")}
          />
          {renderError("name")}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={disableSubmit || isLoading}
            className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 flex items-center gap-2"
          >
            {isLoading ? (submitLabel.endsWith("e") ? `${submitLabel.slice(0, -1)}ing...` : `${submitLabel}ing...`) : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
