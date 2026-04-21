import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { validateFiles } from "@/lib/fileValidation";

export interface PartnershipEventFormData {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  year: number;
  imageUrl: string;
  imageFileName?: string;
  imageFile?: File;
  dateLabel: string;
  eventDate: string;
  location: string;
  organizer: string;
  audience: string;
  highlights: string[];
  details: string[];
  hashtags: string[];
}

interface EditPartnershipAndEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PartnershipEventFormData;
  onSave: (data: PartnershipEventFormData) => void | Promise<void>;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

interface ModalFormData {
  title: string;
  description: string;
  imageUrl: string;
  imageFileName?: string;
  imageFile?: File;
}

const createEmptyFormData = (): ModalFormData => ({
  title: "",
  description: "",
  imageUrl: "",
  imageFile: undefined,
});

const inferFileName = (imageUrl?: string, imageFileName?: string) => {
  if (imageFileName?.trim()) {
    return imageFileName;
  }

  if (!imageUrl?.trim() || imageUrl.startsWith("data:")) {
    return undefined;
  }

  try {
    const url = new URL(imageUrl);
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : undefined;
  } catch {
    const lastSegment = imageUrl.split("/").filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : undefined;
  }
};

export const EditPartnershipAndEventsModal = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  isLoading = false,
  errors = {},
}: EditPartnershipAndEventsModalProps) => {
  const isEditMode = Boolean(initialData?.id);
  const [formData, setFormData] = useState<ModalFormData>(
    initialData || createEmptyFormData()
  );
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useApiFeedbackStore();

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        imageUrl: initialData.imageUrl,
        imageFileName: inferFileName(
          initialData.imageUrl,
          initialData.imageFileName,
        ),
        imageFile: undefined,
      });
    } else {
      setFormData(createEmptyFormData());
    }
  }, [initialData, isOpen]);

  const handleChange = (field: keyof ModalFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFiles([file], {
        acceptedTypes: [".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        label: "partnership or event image",
      });
      if (!validation.valid) {
        setFormData((prev) => ({
          ...prev,
          imageFile: undefined,
          imageUrl: "",
          imageFileName: undefined,
        }));
        showError(validation.error);
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: (event.target?.result as string) || "",
          imageFileName: file.name,
          imageFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: "",
      imageFileName: undefined,
      imageFile: undefined,
    }));
  };

  const buildPayload = (data: ModalFormData): PartnershipEventFormData => {
    const trimmedTitle = data.title.trim();
    const trimmedDescription = data.description.trim();
    const normalizedYear = new Date().getFullYear();

    return {
      ...data,
      title: trimmedTitle,
      subtitle: "",
      description: trimmedDescription,
      year: normalizedYear,
      dateLabel: `School Year ${normalizedYear}`,
      eventDate: `${normalizedYear}-01-01`,
      imageFileName: data.imageFileName,
      imageFile: data.imageFile,
      location: "School Grounds",
      organizer: "School Administration",
      audience: "School Community",
      highlights: [trimmedDescription || "Community event update"],
      details: [trimmedDescription || "Partnership and event details will be posted soon."],
      hashtags: [],
    };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(buildPayload(formData));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = isEditMode
    ? formData.title.trim() !== (initialData?.title ?? "").trim() ||
      formData.description.trim() !== (initialData?.description ?? "").trim() ||
      formData.imageUrl !== (initialData?.imageUrl ?? "") ||
      (formData.imageFileName ?? "") !== (inferFileName(initialData?.imageUrl, initialData?.imageFileName) ?? "") ||
      Boolean(formData.imageFile)
    : Boolean(formData.title.trim() || formData.description.trim() || formData.imageFileName);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      contentClassName="max-w-4xl overflow-hidden p-0"
    >
      <div className="bg-[#fff6bf] px-7 py-6 md:px-8 md:py-7">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-2xl font-bold text-black md:text-[30px]">
            {isEditMode ? "Edit Post" : "Create Post"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center text-red-500 transition-colors hover:text-red-600"
            aria-label="Close"
          >
            <X className="h-8 w-8 stroke-[2.5]" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              autoComplete="off"
              className={`w-full border bg-[#f3f3f3] px-5 py-4 text-xl text-gray-900 focus:outline-none ${
                errors.title ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-500"
              }`}
              placeholder="Add your title here"
            />
            {errors.title && (
              <p className="mt-1 text-sm font-medium text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`min-h-55 max-h-[34vh] w-full resize-y border bg-[#f3f3f3] px-5 py-4 text-lg leading-relaxed text-gray-900 focus:outline-none ${
                errors.description ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-500"
              }`}
              placeholder="Write your partnership/event post details"
              rows={8}
            />
            {errors.description && (
              <p className="mt-1 text-sm font-medium text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="relative min-h-45">
            <div className="max-w-60 space-y-2">
              <p className="text-sm text-gray-500">One file can be uploaded here</p>
              <p className="text-xs text-gray-400">Accepted: JPEG, PNG · Max 10 MB</p>

              {!formData.imageFileName ? (
                <label className="inline-flex cursor-pointer items-center overflow-hidden bg-[#e4ef00] text-gray-900">
                  <span className="inline-flex items-center gap-3 px-4 py-2 text-base font-medium">
                    <Upload className="h-5 w-5" />
                    Upload Picture
                  </span>
                  <span className="inline-flex h-full items-center justify-center border-l border-black/20 px-4 py-2">
                    <Plus className="h-6 w-6 stroke-[2.5]" />
                  </span>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="pt-2">
                  <div className="relative w-31.5">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition-colors hover:text-red-600"
                      aria-label="Remove file"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex h-31.5 w-31.5 items-center justify-center rounded-lg bg-[#bebebe]">
                      <div className="flex h-19.5 w-15.5 flex-col items-center justify-center rounded-2xl bg-[#ef2b2d] text-white shadow-sm">
                        <FileText className="h-8 w-8" />
                        <span className="mt-1 text-xs font-bold uppercase">PDF</span>
                      </div>
                    </div>
                    <p
                      className="mt-2 truncate text-[15px] leading-tight text-gray-700"
                      title={formData.imageFileName}
                    >
                      {formData.imageFileName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 right-0">
              <Button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  isLoading ||
                  !formData.title.trim() ||
                  !formData.description.trim() ||
                  !formData.imageFileName ||
                  (isEditMode && !hasChanges)
                }
                className="h-14 min-w-37.5 rounded-3xl bg-(--button-green) px-8 text-xl font-medium text-white hover:bg-(--button-green) disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
              >
                {isSaving || isLoading
                  ? "Saving..."
                  : isEditMode
                    ? "Save"
                    : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
