import { useEffect, useState } from "react";
import { FileText, Trash2, Upload, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed";
import type { AnnouncementCategory } from "@/lib/announcementPosts";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnnouncementPostItem | null;
  onUpdate: (data: {
    announcementId: number;
    title: string;
    content: string;
    category: AnnouncementCategory;
    files?: Array<{ id: string; name: string; file: File }>;
    replaceAttachments?: boolean;
    removeFileIds?: number[];
  }) => Promise<void>;
}

interface UploadedFile {
  id: string;
  name: string;
  file: File;
}

export const EditAnnouncementModal = ({
  isOpen,
  onClose,
  post,
  onUpdate,
}: EditAnnouncementModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [announcementType, setAnnouncementType] =
    useState<AnnouncementCategory>("general");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { showError, clearFeedback } = useApiFeedbackStore();

  useEffect(() => {
    if (!isOpen || !post) return;
    setTitle(post.announcement_title ?? "");
    setContent(post.announcement_desc ?? "");
    if (post.announcement_type === "Staff_only") {
      setAnnouncementType("staffs");
    } else if (post.announcement_type === "Memorandum") {
      setAnnouncementType("memorandum");
    } else {
      setAnnouncementType("general");
    }
    setSubmitting(false);
    setFiles([]);
    setRemovedFileIds([]);
    clearFeedback();
  }, [isOpen, post, clearFeedback]);

  if (!isOpen || !post) return null;

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

  const handleRemoveExistingAttachment = (fileId?: number) => {
    if (fileId == null) return;
    setRemovedFileIds((prev) =>
      prev.includes(fileId) ? prev : [...prev, fileId],
    );
  };

  const visibleExistingFiles =
    post.files?.filter(({ file }) => !removedFileIds.includes(file.file_id ?? -1)) ||
    [];

  const initialAnnouncementType =
    post.announcement_type === "Staff_only"
      ? "staffs"
      : post.announcement_type === "Memorandum"
        ? "memorandum"
        : "general";

  const hasChanges =
    title.trim() !== (post.announcement_title ?? "").trim() ||
    content.trim() !== (post.announcement_desc ?? "").trim() ||
    announcementType !== initialAnnouncementType ||
    files.length > 0 ||
    removedFileIds.length > 0;
  const handleUpdate = async () => {
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
      await onUpdate({
        announcementId: post.announcement_id,
        title: title.trim(),
        content: content.trim(),
        category: announcementType,
        files,
        replaceAttachments: false,
        removeFileIds: removedFileIds,
      });
      onClose();
    } catch (err) {
      console.error(err);
      showError(err instanceof Error ? err.message : "Failed to update announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-yellow-100 rounded-t-lg sm:rounded-lg shadow-2xl w-full max-w-2xl mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-4 sm:p-6 sticky top-0 bg-yellow-100 border-b border-yellow-200 gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">Edit Announcement</h2>
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 transition-colors text-3xl sm:text-4xl font-bold shrink-0"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Title Input */}
          <input
            type="text"
            placeholder="Enter announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-lg"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-32 sm:min-h-37.5 resize-none text-sm sm:text-base"
            placeholder="Enter announcement content..."
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragDrop}
            className="border-2 border-dashed border-yellow-400 rounded-lg p-3 sm:p-5 bg-[#fff7b0] text-left"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Add Attachments</p>
                <p className="text-xs text-gray-500">
                  You can add new files and remove old ones below.
                </p>
                <p className="text-xs text-gray-400">Accepted: JPEG, PNG, PDF · Max 10 MB per file</p>
              </div>
              <label
                htmlFor="edit-announcement-file-input"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-yellow-500 bg-yellow-300 cursor-pointer font-semibold text-xs sm:text-sm text-black hover:bg-yellow-400 shrink-0"
              >
                <Upload size={14} />
                Choose
              </label>
              <input
                id="edit-announcement-file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {!!visibleExistingFiles.length && (
            <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current attachments
              </p>
              {visibleExistingFiles.map(({ file }) => (
                <div
                  key={`${file.file_name}-${file.file_path}`}
                  className="flex items-center justify-between gap-2 sm:gap-4 border border-gray-200 rounded p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <FileText size={16} className="text-red-500 shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-800 truncate">{file.file_name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveExistingAttachment(file.file_id)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                    type="button"
                    aria-label={`Remove existing ${file.file_name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                New attachments
              </p>
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
                    className="text-red-500 hover:text-red-700 shrink-0"
                    type="button"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}


          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
            <Select
              value={announcementType}
              onValueChange={(value) =>
                setAnnouncementType(value as AnnouncementCategory)
              }
            >
              <SelectTrigger className="w-full sm:w-48 bg-yellow-400 text-black font-semibold border-0 text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="staffs">Staff</SelectItem>
                <SelectItem value="memorandum">Memorandum</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={handleUpdate}
              disabled={submitting || !hasChanges}
              className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-10 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-lg transition-colors disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 shrink-0"
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
