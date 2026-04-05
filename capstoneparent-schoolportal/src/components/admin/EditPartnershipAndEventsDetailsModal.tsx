import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { PartnershipEventItem } from "@/lib/partnershipEvents";

interface EditPartnershipAndEventsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PartnershipEventItem;
  onSave: (event: PartnershipEventItem) => void | Promise<void>;
  isLoading?: boolean;
}

export const EditPartnershipAndEventsDetailsModal = ({
  isOpen,
  onClose,
  event,
  onSave,
  isLoading = false,
}: EditPartnershipAndEventsDetailsModalProps) => {
  const [formData, setFormData] = useState(event);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(event);
  }, [event, isOpen]);

  const handleChange = (field: keyof PartnershipEventItem, value: any) => {
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
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Post"
      contentClassName="max-w-3xl"
    >
      <div className="space-y-6 bg-yellow-50 p-6 rounded-lg">
        {/* Title */}
        <div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border-2 border-gray-800 bg-white px-4 py-3 text-2xl font-bold focus:outline-none"
            placeholder="Title"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border-2 border-gray-800 bg-white px-4 py-3 text-base leading-relaxed focus:outline-none"
            placeholder="Description"
            rows={6}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Multiple files can be uploaded here</p>
          <label className="flex items-center justify-center gap-3 rounded-lg bg-yellow-300 px-6 py-3 cursor-pointer hover:bg-yellow-400 font-semibold">
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

        {/* Image Preview */}
        {formData.imageUrl && (
          <div className="mt-4">
            <img
              src={formData.imageUrl}
              alt="Preview"
              className="max-h-80 w-full object-cover rounded-lg"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-800">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-(--button-green) hover:bg-(--button-green) rounded-full px-8 text-white font-semibold"
          >
            {isSaving || isLoading ? "Saving..." : "Edit Post"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
