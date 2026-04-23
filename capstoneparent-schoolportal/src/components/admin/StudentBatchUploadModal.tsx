import { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";
import { ActionConfirmationModal } from "../general/ActionConfirmationModal";

interface StudentBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export const StudentBatchUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  isUploading = false,
}: StudentBatchUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showError, clearFeedback } = useApiFeedbackStore();

  const resetState = () => {
    setSelectedFile(null);
    clearFeedback();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    clearFeedback();

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateFiles([file], {
      acceptedTypes: [".xlsx"],
      label: "student XLSX",
    });
    if (!validation.valid) {
      setSelectedFile(null);
      showError(validation.error);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    if (!selectedFile) {
      showError("Please choose an .xlsx file to upload.");
      return;
    }
    setShowConfirm(true);
  };

  const handleUploadConfirm = async () => {
    setShowConfirm(false);
    if (!selectedFile) return;

    clearFeedback();

    try {
      await onUpload(selectedFile);
      resetState();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to upload student XLSX.",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Batch Add Students">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Upload a student list XLSX file. The file should include a{" "}
          <strong>Grade Level</strong> column using Kindergarten or Grade 1 to
          Grade 6.
        </p>

        <div className="rounded-md border-2 border-dashed border-black bg-white p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full rounded-md border border-gray-300 bg-gray-100 text-black hover:bg-gray-200"
          >
            <Upload className="mr-2 h-4 w-4" />
            Select XLSX File
          </Button>
          <p className="mt-1 text-center text-xs text-gray-400">
            Accepted: XLSX only · No size limit
          </p>

          <div className="mt-3 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <FileText className="h-5 w-5 text-(--button-green)" />
            <span className="text-sm text-gray-700">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="rounded-full bg-(--button-green) px-8 py-3 text-lg text-white hover:bg-(--button-hover-green)"
          >
            {isUploading ? "Uploading..." : "Upload XLSX"}
          </Button>
        </div>
      </div>

      <ActionConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleUploadConfirm}
        title="Confirm Batch Upload"
        message={`Are you sure you want to upload the students from "${selectedFile?.name}"?`}
        confirmLabel="Upload"
        isLoading={isUploading}
      />
    </Modal>
  );
};
