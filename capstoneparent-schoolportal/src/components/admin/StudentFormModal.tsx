import React from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import type { GradeLevel, StudentStatus } from "@/lib/api/types";

export interface StudentFormData {
  firstName: string;
  lastName: string;
  sex: "" | "M" | "F";
  lrn: string;
  gradeLevelId: string;
  status: "" | StudentStatus;
  schoolYearStart: string;
  schoolYearEnd: string;
}

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitLabel: string;
  formData: StudentFormData;
  setFormData: React.Dispatch<React.SetStateAction<StudentFormData>>;
  gradeLevels: GradeLevel[];
  isSubmitting?: boolean;
  canEditStatus?: boolean;
  disableSubmit?: boolean;
}

export const StudentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel,
  formData,
  setFormData,
  gradeLevels,
  isSubmitting = false,
  canEditStatus = true,
  disableSubmit = false,
}: StudentFormModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          className="w-full rounded-md border-2 border-black px-4 py-3 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          className="w-full rounded-md border-2 border-black px-4 py-3 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
        />
        <select
          value={formData.sex}
          onChange={(e) =>
            setFormData({ ...formData, sex: e.target.value as "" | "M" | "F" })
          }
          className="w-full rounded-md border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-(--button-green)"
        >
          <option value="">Select sex</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <input
          type="text"
          inputMode="numeric"
          placeholder="LRN Number"
          value={formData.lrn}
          onChange={(e) =>
            setFormData({
              ...formData,
              lrn: e.target.value.replace(/\D/g, "").slice(0, 12),
            })
          }
          className="w-full rounded-md border-2 border-black px-4 py-3 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
        />
        <select
          value={formData.gradeLevelId}
          onChange={(e) =>
            setFormData({ ...formData, gradeLevelId: e.target.value })
          }
          className="w-full rounded-md border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-(--button-green)"
        >
          <option value="">Select grade level</option>
          {gradeLevels.map((gradeLevel) => (
            <option key={gradeLevel.gl_id} value={String(gradeLevel.gl_id)}>
              {gradeLevel.grade_level}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            type="number"
            min="2000"
            max="2100"
            placeholder="School Year Start"
            value={formData.schoolYearStart}
            onChange={(e) =>
              setFormData({ ...formData, schoolYearStart: e.target.value })
            }
            className="w-full rounded-md border-2 border-black px-4 py-3 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
          />
          <input
            type="number"
            min="2000"
            max="2101"
            placeholder="School Year End"
            value={formData.schoolYearEnd}
            onChange={(e) =>
              setFormData({ ...formData, schoolYearEnd: e.target.value })
            }
            className="w-full rounded-md border-2 border-black px-4 py-3 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
          />
        </div>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as "" | StudentStatus,
            })
          }
          disabled={!canEditStatus}
          className="w-full rounded-md border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-(--button-green) disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">Select status</option>
          <option value="ENROLLED">ENROLLED</option>
          <option value="TRANSFERRED">TRANSFERRED</option>
          <option value="GRADUATED">GRADUATED</option>
          <option value="DROPPED">DROPPED</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || disableSubmit}
            className="rounded-full bg-(--button-green) px-8 py-3 text-lg text-white hover:bg-(--button-hover-green) disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
