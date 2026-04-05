import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";

export interface PartnershipEventFormData {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  year: number;
  imageUrl: string;
  imageFileName?: string;
  dateLabel: string;
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
}

interface ModalFormData {
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  imageFileName?: string;
}

const emptyFormData: ModalFormData = {
  title: "",
  description: "",
  year: new Date().getFullYear(),
  imageUrl: "",
};

export const EditPartnershipAndEventsModal = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  isLoading = false,
}: EditPartnershipAndEventsModalProps) => {
  const [formData, setFormData] = useState<ModalFormData>(
    initialData || emptyFormData
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        year: initialData.year,
        imageUrl: initialData.imageUrl,
        imageFileName: initialData.imageFileName,
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [initialData, isOpen]);

  const handleChange = (field: keyof ModalFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: (event.target?.result as string) || "",
          imageFileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const buildPayload = (data: ModalFormData): PartnershipEventFormData => {
    const trimmedTitle = data.title.trim();
    const trimmedDescription = data.description.trim();
    const normalizedYear = Number.isFinite(data.year)
      ? data.year
      : new Date().getFullYear();
    const derivedHashTag = trimmedTitle
      ? `#${trimmedTitle.replace(/\s+/g, "")}`
      : "#PartnershipEvent";

    return {
      ...data,
      title: trimmedTitle,
      subtitle: "",
      description: trimmedDescription,
      year: normalizedYear,
      dateLabel: `School Year ${normalizedYear}`,
      location: "School Grounds",
      organizer: "School Administration",
      audience: "School Community",
      highlights: [trimmedDescription || "Community event update"],
      details: [trimmedDescription || "Partnership and event details will be posted soon."],
      hashtags: [derivedHashTag],
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? "Edit Post" : "Create Post"}
      contentClassName="max-w-4xl"
    >
      <div className="space-y-6 bg-[#f1edc1] p-5 md:p-6">
        <div className="space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border border-gray-700 bg-[#dddddd] px-4 py-3 text-2xl font-semibold text-gray-900 focus:outline-none"
            placeholder="Post title"
          />

          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border border-gray-700 bg-[#dddddd] px-4 py-3 text-base leading-relaxed text-gray-900 focus:outline-none"
            placeholder="Write your partnership/event post details"
            rows={8}
          />

          <div className="grid grid-cols-1 gap-3">
            <input
              type="number"
              value={formData.year}
              onChange={(e) => handleChange("year", Number(e.target.value))}
              className="w-full border border-gray-700 bg-[#dddddd] px-4 py-2 text-base text-gray-900 focus:outline-none"
              placeholder="Year"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">Upload image used by the card</p>
          <label className="inline-flex cursor-pointer items-center gap-3 bg-[#d2e20f] px-4 py-2 font-semibold text-gray-900">
            <Upload className="h-5 w-5" />
            <span>Upload Picture</span>
            <input
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              isLoading ||
              !formData.title.trim() ||
              !formData.description.trim()
            }
            className="rounded-full bg-(--button-green) px-8 hover:bg-(--button-green)"
          >
            {isSaving || isLoading
              ? "Saving..."
              : initialData?.id
                ? "Edit Post"
                : "Post"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
