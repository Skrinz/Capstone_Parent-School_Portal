import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Yes, Proceed',
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="bg-[#FFFACD] border-none max-w-sm p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>
            <button
              type="button"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <X className="h-8 w-8" strokeWidth={3} />
            </button>
          </div>
          <DialogDescription className="sr-only">
            Confirmation dialog for: {title}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-gray-700">{message}</p>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="bg-(--status-denied) text-white hover:bg-red-700"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-(--button-green) hover:bg-green-700 text-white"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
