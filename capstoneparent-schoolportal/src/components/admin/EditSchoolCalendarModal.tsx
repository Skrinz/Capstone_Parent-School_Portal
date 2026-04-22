import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormInputError } from "@/components/ui/FormInputError";
import { resolveMediaUrl } from "@/lib/api/base";
import type { SchoolCalendarItem } from "@/lib/schoolCalendarContent";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";
import { ActionConfirmationModal } from "../general/ActionConfirmationModal";

export type CalendarModalMode = "add" | "edit";

interface EditSchoolCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CalendarModalMode;
  calendars: SchoolCalendarItem[];
  /** School year of the calendar being edited (edit mode only) */
  editYear?: string;
  onSave: (updatedCalendar: SchoolCalendarItem, file?: File) => void | Promise<void>;
  errors?: Record<string, string>;
}

function getReadableFileName(calendar: SchoolCalendarItem): string {
  if (calendar.fileName) {
    return calendar.fileName;
  }

  if (!calendar.imageUrl) {
    return "No file selected";
  }

  if (calendar.imageUrl.startsWith("data:")) {
    return `SchoolCalendar-${calendar.year}.png`;
  }

  const filePart = calendar.imageUrl.split("/").pop();
  return filePart || `SchoolCalendar-${calendar.year}.png`;
}

const currentYearString = () => String(new Date().getFullYear());

export const EditSchoolCalendarModal = ({
  isOpen,
  onClose,
  mode,
  calendars,
  editYear,
  onSave,
  errors = {},
}: EditSchoolCalendarModalProps) => {
  const [yearInput, setYearInput] = useState(currentYearString());
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [fileName, setFileName] = useState("No file selected");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showError, clearFeedback } = useApiFeedbackStore();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) =>
    String(currentYear - 10 + i)
  );

  const calendarForEdit = useMemo(() => {
    if (mode !== "edit" || !editYear) {
      return null;
    }
    return calendars.find((c) => c.year === editYear) ?? null;
  }, [mode, editYear, calendars]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    clearFeedback();

    if (mode === "add") {
      setYearInput(currentYearString());
      setPreviewImageUrl("");
      setFileName("No file selected");
      setSelectedFile(null);
      return;
    }

    if (mode === "edit" && editYear) {
      const c =
        calendars.find((ch) => ch.year === editYear) ?? ({
          year: editYear,
          label: "",
          imageUrl: "",
          fileName: "",
        } as SchoolCalendarItem);
      setYearInput(c.year);
      setPreviewImageUrl(c.imageUrl ? resolveMediaUrl(c.imageUrl) : "");
      setFileName(getReadableFileName(c));
      setSelectedFile(null);
    }
  }, [isOpen, mode, editYear, calendars]);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validation = validateFiles([file], {
      acceptedTypes: [".jpg", ".jpeg", ".png"],
      maxSizeMB: 10,
      label: "school calendar",
    });
    if (!validation.valid) {
      setSelectedFile(null);
      showError(validation.error);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setPreviewImageUrl(result);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const hasChanges =
    mode === "edit"
      ? yearInput !== (calendarForEdit?.year ?? "") || Boolean(selectedFile)
      : Boolean(selectedFile);

  const handleSaveClick = () => {
    if (mode === "add" && !selectedFile) {
      showError("Please upload a school calendar image.");
      return;
    }
    if (mode === "edit" && !hasChanges) {
      showError("No changes to save.");
      return;
    }
    setShowConfirm(true);
  };

  const handleSaveConfirm = async () => {
    setShowConfirm(false);
    const base: SchoolCalendarItem = {
      year: yearInput,
      label: calendarForEdit?.label || "",
      imageUrl: previewImageUrl || calendarForEdit?.imageUrl || "",
      fileName,
    };

    try {
      setIsSaving(true);
      await onSave(
        {
          ...base,
          imageUrl: selectedFile ? previewImageUrl : base.imageUrl,
        },
        selectedFile || undefined,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const title = mode === "add" ? "Add school calendar" : "Edit school calendar";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} contentClassName="max-w-3xl">
      <div className="space-y-6">
        {mode === "add" ? (
          <p className="text-lg text-black/80">
            Choose the school year and upload a calendar image. Only image files (JPEG, PNG) are accepted · Max 10 MB.
          </p>
        ) : (
          <p className="text-lg text-black/80">
            Update the image for this school year, or replace the file below. Only image files (JPEG, PNG) are accepted · Max 10 MB.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="school-calendar-year" className="text-lg font-semibold">
            School year
          </label>
          <select
            id="school-calendar-year"
            value={yearInput}
            onChange={(event) => setYearInput(event.target.value)}
            className={`w-full rounded-md border-2 bg-white px-4 py-3 text-lg focus:outline-none focus:ring-2 transition-all ${
              errors.yearInput
                ? "border-red-500 focus:ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                : "border-black focus:ring-(--button-green)"
            }`}
            disabled={isSaving}
          >
            <option value="">Select school year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <FormInputError message={errors.yearInput} />
        </div>

        <div
          className={`mx-auto flex min-h-[200px] max-h-[40vh] w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-black/25 bg-white ${
            previewImageUrl ? "border-solid border-black/20" : ""
          }`}
        >
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt="School calendar preview"
              className="max-h-[40vh] w-full object-contain"
            />
          ) : (
            <p className="px-4 text-center text-lg text-black/50">No image selected yet</p>
          )}
        </div>

        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-black/60">File</p>
          <p className="text-lg">{fileName}</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={isSaving}
            className="h-auto rounded-md bg-(--navbar-bg) px-8 py-3 text-lg font-medium text-black hover:bg-yellow-300 disabled:opacity-50"
          >
            Picture upload
            <Plus className="ml-2 h-6 w-6 text-black" strokeWidth={3} />
          </Button>

          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="bg-(--button-green) hover:bg-(--button-hover-green) rounded-full px-8 py-3 text-lg text-white disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 inline-flex items-center gap-2"
          >
            {isSaving && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <ActionConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => void handleSaveConfirm()}
        title={mode === "add" ? "Confirm Add School Calendar" : "Confirm Save Changes"}
        message={
          mode === "add"
            ? `Are you sure you want to add the school calendar for school year ${yearInput}?`
            : "Are you sure you want to save changes to this school calendar?"
        }
        confirmLabel={mode === "add" ? "Add Calendar" : "Save Changes"}
        isLoading={isSaving}
      />
    </Modal>
  );
};
