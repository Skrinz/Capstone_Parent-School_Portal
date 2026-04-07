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
}: SectionFormModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Section name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
        />
        <div className="flex justify-end">
          <Button
            type="button"
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
