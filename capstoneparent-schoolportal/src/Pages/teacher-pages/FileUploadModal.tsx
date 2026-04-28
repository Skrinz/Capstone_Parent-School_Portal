import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApiFeedbackStore } from '@/lib/store/apiFeedbackStore';
import { validateFiles } from '@/lib/fileValidation';
import { ActionConfirmationModal } from '@/components/general/ActionConfirmationModal';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  title: string;
  acceptedFileTypes: string[]; // e.g., ['.xlsx', '.csv'] or ['.png', '.jpg', '.jpeg']
  maxSizeMB?: number;
}

export const FileUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title,
  acceptedFileTypes,
  maxSizeMB = 10,
}: FileUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, clearFeedback } = useApiFeedbackStore();

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearFeedback();
    const validation = validateFiles([file], {
      acceptedTypes: acceptedFileTypes,
      maxSizeMB,
      label: title.toLowerCase(),
    });
    if (!validation.valid) {
      setSelectedFile(null);
      showError(validation.error);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    if (!selectedFile) {
      showError(`Please select a valid file for ${title.toLowerCase()}.`);
      return;
    }
    setShowConfirm(true);
  };

  const handleUploadConfirm = async () => {
    setShowConfirm(false);
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setShowConfirm(false);
    clearFeedback();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="h-12 w-12 text-gray-400" />;
    
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const imageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    if (imageTypes.includes(fileExtension)) {
      return <ImageIcon className="h-12 w-12 text-blue-500" />;
    }
    return <FileText className="h-12 w-12 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDisplayFileName = (fileName: string, maxLength = 40) => {
    if (fileName.length <= maxLength) return fileName;

    const extensionIndex = fileName.lastIndexOf('.');
    if (extensionIndex <= 0 || extensionIndex === fileName.length - 1) {
      return `${fileName.slice(0, maxLength - 3)}...`;
    }

    const extension = fileName.slice(extensionIndex);
    const baseNameMaxLength = maxLength - extension.length - 3;

    if (baseNameMaxLength <= 0) {
      return `${fileName.slice(0, maxLength - 3)}...`;
    }

    return `${fileName.slice(0, baseNameMaxLength)}...${extension}`;
  };

  return (
    <>
      <Dialog open={isOpen && !showConfirm} onOpenChange={handleClose}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="relative p-6 pb-4">
            <div className="pr-12">
              <DialogTitle className="min-w-0 text-2xl leading-tight font-bold text-gray-900">
                {title}
              </DialogTitle>
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-red-600 transition-colors hover:text-red-700"
                disabled={isUploading}
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Upload a file for {title.toLowerCase()}. Accepted file types are {acceptedFileTypes.join(', ')}.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* File Input Button */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300"
                disabled={isUploading}
              >
                <Upload className="mr-2 h-5 w-5" />
                Select File
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Accepted formats: {acceptedFileTypes.join(', ')} (Max {maxSizeMB}MB)
              </p>
            </div>

            {/* Selected File Display */}
            <div className="min-h-[120px] overflow-hidden bg-white border-2 border-gray-300 rounded-lg p-4">
              {selectedFile ? (
                <div className="flex items-start gap-4 overflow-hidden">
                  <div className="flex-shrink-0">
                    {getFileIcon()}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="font-semibold text-gray-900 truncate" title={selectedFile.name}>
                      {formatDisplayFileName(selectedFile.name)}
                    </p>
                    <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {selectedFile.type || 'Unknown'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FileText className="h-12 w-12 mb-2" />
                  <p className="text-sm">No file selected</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ActionConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => void handleUploadConfirm()}
        title="Confirm File Upload"
        message={`Are you sure you want to upload "${selectedFile?.name}"?`}
        confirmLabel="Upload"
        isLoading={isUploading}
      >
        {imagePreviewUrl ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Preview</p>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={imagePreviewUrl}
                alt={selectedFile?.name ?? 'Selected upload preview'}
                className="max-h-80 w-full object-contain"
              />
            </div>
          </div>
        ) : null}
      </ActionConfirmationModal>
    </>
  );
};
