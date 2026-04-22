import { useEffect, useState } from "react";
import { FileText, Trash2, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";

type AnnouncementCategory = "general" | "staffs" | "memorandum";

interface UploadedFile {
  id: string;
  name: string;
  file: File;
}

interface AnnouncementData {
  title: string;
  content: string;
  category: AnnouncementCategory;
  files: UploadedFile[];
}

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AnnouncementData) => Promise<void>;
  defaultCategory?: AnnouncementCategory;
}

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
  onCreate,
  defaultCategory = "general",
}: CreateAnnouncementModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { showError, clearFeedback } = useApiFeedbackStore();

  useEffect(() => {
    if (!isOpen) return;
    setCategory(defaultCategory);
    setSubmitting(false);
    setTitle("");
    setContent("");
    setFiles([]);
    clearFeedback();
  }, [isOpen, defaultCategory, clearFeedback]);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    const fileList = Array.from(uploadedFiles);
    const validation = validateFiles(fileList, {
      acceptedTypes: [".jpg", ".jpeg", ".png", ".pdf"],
      maxSizeMB: 10,
      label: "announcement attachment",
    });
    if (!validation.valid) {
      showError(validation.error);
      e.target.value = "";
      return;
    }
    fileList.forEach((file) => {
      setFiles((prev) => [
        ...prev,
        { id: Math.random().toString(), name: file.name, file },
      ]);
    });
    // allow re-upload of same file names
    e.target.value = "";
  };

  const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;
    const fileList = Array.from(droppedFiles);
    const validation = validateFiles(fileList, {
      acceptedTypes: [".jpg", ".jpeg", ".png", ".pdf"],
      maxSizeMB: 10,
      label: "announcement attachment",
    });
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    fileList.forEach((file) => {
      setFiles((prev) => [
        ...prev,
        { id: Math.random().toString(), name: file.name, file },
      ]);
    });
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };
  const handlePost = async () => {
    if (!title.trim()) {
      showError("Please enter an announcement title.");
      return;
    }
    if (!content.trim()) {
      showError("Please enter announcement details.");
      return;
    }

    clearFeedback();

    setSubmitting(true);
    try {
      const data: AnnouncementData = {
        title: title.trim(),
        content: content.trim(),
        category,
        files,
      };

      await onCreate(data);
      onClose();
    } catch (err) {
      console.error(err);
      showError(err instanceof Error ? err.message : "Failed to create announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative rounded-t-lg sm:rounded-lg shadow-2xl w-full max-w-2xl mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto bg-[#fff7b0]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start p-4 sm:p-6 sticky top-0 border-b border-yellow-200 bg-[#fff7b0] gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">Create Announcement</h2>
          <button
            onClick={onClose}
            aria-label="Close create announcement modal"
            className="text-red-600 hover:text-red-800 transition-colors text-3xl sm:text-4xl font-bold shrink-0"
          >
            <X />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <input
            type="text"
            placeholder="Enter announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-yellow-300 bg-[#fff7b0] text-sm sm:text-lg placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the announcement details..."
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-yellow-300 bg-[#fff7b0] min-h-37.5 sm:min-h-55 resize-none text-sm sm:text-base placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
          />


          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragDrop}
            className="border-2 border-dashed border-yellow-400 rounded-lg p-3 sm:p-5 bg-[#fff7b0] text-left"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-700">File Upload</p>
                <p className="text-xs text-gray-500">Multiple files can be uploaded here</p>
                <p className="text-xs text-gray-400">Accepted: JPEG, PNG, PDF · Max 10 MB per file</p>
              </div>
              <label
                htmlFor="create-announcement-file-input"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-yellow-500 bg-yellow-300 cursor-pointer font-semibold text-xs sm:text-sm text-black hover:bg-yellow-400 shrink-0"
              >
                <Upload size={14} />
                Choose
              </label>
              <input
                id="create-announcement-file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* File preview list should only show after upload */}
          {files.length > 0 && (
            <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-2 sm:gap-4 border border-gray-200 rounded p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <FileText size={16} className="text-red-500 shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-800 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                    type="button"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <Select value={category} onValueChange={(v) => setCategory(v as AnnouncementCategory)}>
              <SelectTrigger className="w-full sm:w-52 bg-yellow-400 text-black font-semibold border-0 text-sm sm:text-base">
                <SelectValue placeholder="Announcement Type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="staffs">Staff</SelectItem>
                <SelectItem value="memorandum">Memorandum</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={handlePost}
              type="button"
              disabled={submitting}
              className="bg-green-500 hover:bg-green-600 text-white px-8 sm:px-10 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-lg transition-colors disabled:opacity-60 shrink-0"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
