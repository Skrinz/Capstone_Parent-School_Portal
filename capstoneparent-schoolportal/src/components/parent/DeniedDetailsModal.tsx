import { X, Trash2, Loader2 } from "lucide-react";
import type { Child } from "./parentModalTypes";

interface DeniedDetailsModalProps {
  isOpen: boolean;
  child: Child | null;
  deniedUploads: File[];
  isFormValid: boolean;
  onDeniedFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDeniedFile: (index: number) => void;
  onResubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const DeniedDetailsModal = ({
  isOpen,
  child,
  deniedUploads,
  isFormValid,
  onDeniedFileChange,
  onRemoveDeniedFile,
  onResubmit,
  onClose,
  isSubmitting = false,
}: DeniedDetailsModalProps) => {
  if (!isOpen || !child) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
      <div className="w-full max-w-3xl rounded-xl p-8 sm:p-10 shadow-2xl overflow-y-auto" style={{ backgroundColor: "#FCF5CA" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-4xl font-bold text-black font-sans">Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-red-500 transition-colors hover:text-red-600 shrink-0"
            aria-label="Close denied details modal"
          >
            <X className="h-10 w-10 font-bold" strokeWidth={3} />
          </button>
        </div>

        {/* Info Section */}
        <div className="space-y-2 mb-10 text-black text-2xl font-normal">
          <p>
            Student name: <span className="font-bold">{child.name}</span>
          </p>
          <p>
            Status: <span className="text-red-600 font-bold">DENIED</span>
          </p>
          <p>
            Date Submitted: {child.dateSubmitted || "-"}
          </p>
          <p className="leading-tight">
            Remarks: {child.remarks || "No remarks provided."}
          </p>
        </div>

        <div className="text-2xl font-normal mb-6 text-black">
          Uploaded Files:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 mb-8">
          {/* Left Column: Requirements */}
          <div>
            <div className="text-[#C0392B] italic text-lg mb-2">Registration Requirements:</div>
            <ul className="space-y-4 text-xl text-[#C0392B]">
              <li className="flex gap-2">
                <span className="font-bold tracking-tighter">•</span>
                <span className="italic font-bold">Parent's Birth Certificate</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold tracking-tighter">•</span>
                <span className="italic">
                  <span className="font-bold">Government-issued ID</span> if Parent's Birth Certificate is not available.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold tracking-tighter">•</span>
                <span className="italic font-bold">Child's Birth Certificate</span>
              </li>
            </ul>
          </div>

          {/* Right Column: File Upload */}
          <div className="flex flex-col gap-3">
            <label
              htmlFor="denied-files-upload"
              className="flex items-center justify-between cursor-pointer px-4 py-3 font-bold text-black shadow-sm transition-all select-none hover:opacity-90"
              style={{ backgroundColor: "#C0D53B" }}
            >
              <span className="text-xl">File Upload</span>
              <span className="text-3xl font-bold leading-none">+</span>
            </label>
            <input
              id="denied-files-upload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={onDeniedFileChange}
            />

            <div className="space-y-2">
              {deniedUploads.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex justify-between items-center bg-white px-3 py-1 shadow-sm border border-gray-100">
                  <span className="text-sm font-medium text-gray-800 truncate pr-2">{file.name}</span>
                  <button type="button" onClick={() => onRemoveDeniedFile(index)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12 mb-4">
          <button
            type="button"
            onClick={onResubmit}
            disabled={!isFormValid || isSubmitting}
            className="px-12 py-3 text-2xl font-bold text-white rounded-3xl transition-all flex items-center justify-center gap-3 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#4eb872" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Resubmitting...</span>
              </>
            ) : (
              "Resubmit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};