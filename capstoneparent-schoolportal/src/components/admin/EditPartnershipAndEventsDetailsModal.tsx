import {
  EditPartnershipAndEventsModal,
  type PartnershipEventFormData,
} from "@/components/admin/EditPartnershipAndEventsModal";
import type { PartnershipEventItem } from "@/lib/partnershipEvents";

const inferFileName = (imageUrl?: string) => {
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

interface EditPartnershipAndEventsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PartnershipEventItem;
  onSave: (data: PartnershipEventFormData) => void | Promise<void>;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export const EditPartnershipAndEventsDetailsModal = ({
  isOpen,
  onClose,
  event,
  onSave,
  isLoading = false,
  errors = {},
}: EditPartnershipAndEventsDetailsModalProps) => {
  const initialData: PartnershipEventFormData = {
    ...event,
    imageFileName: inferFileName(event.imageUrl),
    imageFile: event.imageFile,
  };

  return (
    <EditPartnershipAndEventsModal
      isOpen={isOpen}
      onClose={onClose}
      initialData={initialData}
      onSave={onSave}
      isLoading={isLoading}
      errors={errors}
    />
  );
};
