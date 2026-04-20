import { X } from "lucide-react";
import type { Child, UploadedDoc } from "./parentModalTypes";

interface PendingDetailsModalProps {
  isOpen: boolean;
  child: Child | null;
  files: UploadedDoc[];
  selectedPreviewName: string;
  selectedPreviewUrl: string;
  onPreview: (doc: UploadedDoc) => void;
  onOpenPdf: (doc: UploadedDoc) => void;
  onClose: () => void;
}

// Determine icon color based on file extension
const getFileType = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "IMG";
  return "PDF";
};

const FileIcon = ({ name }: { name: string }) => {
  const type = getFileType(name);
  return (
    <div className="relative flex items-center justify-center w-16 h-20">
      {/* File body */}
      <div className="absolute inset-0 bg-red-500 rounded-sm" style={{ clipPath: "polygon(0 0, 75% 0, 100% 15%, 100% 100%, 0 100%)" }} />
      {/* Folded corner */}
      <div className="absolute top-0 right-0 w-5 h-5 bg-red-300 rounded-bl" style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
      {/* Label */}
      <span className="relative z-10 mt-4 text-white text-xs font-extrabold tracking-widest">
        {type}
      </span>
    </div>
  );
};

export const PendingDetailsModal = ({
  isOpen,
  child,
  files,
  onClose,
}: PendingDetailsModalProps) => {
  if (!isOpen || !child) return null;

  const handleFileClick = (doc: UploadedDoc) => {
    const url = doc.url || (doc.file ? URL.createObjectURL(doc.file) : "");
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl p-6 relative"
        style={{ backgroundColor: "#FCF5CA" }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-red-600 hover:text-red-700 transition-colors"
          aria-label="Close details modal"
        >
          <X className="h-8 w-8" strokeWidth={3} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold text-black mb-5">Details</h2>

        {/* Info */}
        <div className="space-y-1.5 text-base text-black mb-7">
          <p>
            Student name:{" "}
            <span className="font-bold">{child.name}</span>
          </p>
          <p>
            Status:{" "}
            <span className="font-bold text-amber-500">{child.status}</span>
          </p>
          <p>
            Date Submitted:{" "}
            <span className="font-semibold">{child.dateSubmitted || "—"}</span>
          </p>
          <p>
            Remarks:{" "}
            <span className="font-semibold">{child.remarks || ""}</span>
          </p>
        </div>

        {/* Uploaded Files */}
        <div>
          <p className="text-xl font-bold text-black mb-4">Uploaded Files:</p>

          {files.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {files.map((doc) => (
                <button
                  key={doc.name}
                  type="button"
                  onClick={() => handleFileClick(doc)}
                  disabled={!doc.url && !doc.file}
                  title={doc.url || doc.file ? "Click to open in new tab" : "No file available"}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-400/30 hover:bg-gray-400/50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-28"
                >
                  <FileIcon name={doc.name} />
                  <span className="text-xs text-black font-medium text-center w-full truncate leading-tight">
                    {doc.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No uploaded files yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};