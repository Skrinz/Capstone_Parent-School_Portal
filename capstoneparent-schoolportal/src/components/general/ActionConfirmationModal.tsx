import React from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'destructive';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  children,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-base text-gray-900">{message}</p>
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
              confirmVariant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-(--button-green) hover:bg-(--button-hover-green)'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
