import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "destructive";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  isLoading = false,
  children,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="z-[60] max-h-[90vh] overflow-y-auto rounded-lg border-0 bg-yellow-100 p-0 shadow-2xl sm:max-w-lg"
        onEscapeKeyDown={(event) => {
          if (isLoading) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isLoading) event.preventDefault();
        }}
      >
        <div className="flex items-start justify-between p-6 pb-3">
          <DialogTitle className="text-3xl font-bold text-black">
            {title}
          </DialogTitle>

          <DialogClose asChild>
            <button
              type="button"
              disabled={isLoading}
              className="text-red-600 transition-colors hover:text-red-800 disabled:opacity-60"
              aria-label="Close modal"
            >
              <X className="h-8 w-8" strokeWidth={3} />
            </button>
          </DialogClose>
        </div>

        <div className="space-y-6 px-6 pb-6">
          <DialogDescription className="text-base text-gray-900">
            {message}
          </DialogDescription>

          {children}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 rounded-full bg-gray-500 px-6 text-base font-semibold text-white hover:bg-gray-600 disabled:opacity-60"
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`h-11 rounded-full px-6 text-base font-semibold text-white disabled:opacity-60 ${
                confirmVariant === "destructive"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-(--button-green) hover:bg-(--button-hover-green)"
              }`}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
