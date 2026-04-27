import { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";
import { ActionConfirmationModal } from "../general/ActionConfirmationModal";
import { ImportResultModal } from "../general/ImportResultModal";
import {
  emptyImportSummary,
  resolveImportSummary,
  type ImportSummaryData,
  type ImportSummaryResponse,
} from "@/lib/importSummary";

interface StudentBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<ImportSummaryResponse | void>;
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
  const [summary, setSummary] = useState<ImportSummaryData | null>(null);
  const { showError, clearFeedback } = useApiFeedbackStore();

  const resetState = () => {
    setSelectedFile(null);
    setSummary(null);
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
      acceptedTypes: [".csv"],
      label: "student CSV",
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
      showError("Please choose a .csv file to upload.");
      return;
    }
    setShowConfirm(true);
  };

  const handleUploadConfirm = async () => {
    setShowConfirm(false);
    if (!selectedFile) return;

    clearFeedback();

    try {
      const response = await onUpload(selectedFile);
      setSummary(resolveImportSummary(response) || { ...emptyImportSummary });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to upload student CSV.",
      );
    }
  };

  const handleSummaryClose = () => {
    resetState();
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen && !summary} onClose={handleClose} title="Batch Add Students">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Upload a student list CSV file. The file should include these columns:{" "}
            <strong>First Name</strong>, <strong>Last Name</strong>, <strong>Sex</strong>,{" "}
            <strong>LRN Number</strong>, <strong>Grade Level</strong>,{" "}
            <strong>School Year Start</strong>, and <strong>School Year End</strong>.{" "}
            Use <strong>Kindergarten</strong> or <strong>Grade 1</strong> to <strong>Grade 6</strong>{" "}
            for the grade level values.
          </p>

          <div className="rounded-md border-2 border-dashed border-black bg-white p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
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
              Select CSV File
            </Button>
            <p className="mt-1 text-center text-xs text-gray-400">
              Accepted: CSV only · No size limit
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
              {isUploading ? "Uploading..." : "Upload CSV"}
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

      <ImportResultModal
        isOpen={Boolean(summary)}
        onClose={handleSummaryClose}
        summary={summary}
      />
    </>
  );
};
